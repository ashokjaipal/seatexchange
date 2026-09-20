import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Database } from "./types";

/**
 * Storage adapters for the whole database document.
 *
 *  - FileStore: a JSON file on disk. Default for local development. On
 *    serverless hosts (Vercel, Netlify, Lambda) the project directory is
 *    read-only, so it falls back to the OS temp directory. That keeps the
 *    app running but data is ephemeral there, so use RedisStore in production.
 *  - RedisStore: Upstash Redis / Vercel KV over their REST API (no native
 *    dependencies). Enabled automatically when the REST URL + token env vars
 *    exist. The whole document is stored under one key, which is plenty for
 *    an MVP and trivially replaceable by a real schema later.
 */
export interface Store {
  readonly name: string;
  readonly remote: boolean;
  load(): Promise<Database | null>;
  save(db: Database): Promise<void>;
}

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

export class FileStore implements Store {
  readonly name: string;
  readonly remote = false;
  private file: string;

  constructor(file?: string) {
    this.file = file || (IS_SERVERLESS ? path.join(os.tmpdir(), "seatbadlo", "db.json") : path.join(process.cwd(), "data", "db.json"));
    this.name = `file:${this.file}`;
  }

  async load(): Promise<Database | null> {
    try {
      if (!fs.existsSync(/* turbopackIgnore: true */ this.file)) return null;
      return JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ this.file, "utf8")) as Database;
    } catch (err) {
      console.error("[store] failed to read", this.file, err);
      return null;
    }
  }

  async save(db: Database): Promise<void> {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(this.file), { recursive: true });
    fs.writeFileSync(/* turbopackIgnore: true */ tmp, JSON.stringify(db, null, 2));
    fs.renameSync(/* turbopackIgnore: true */ tmp, this.file);
  }
}

export class RedisStore implements Store {
  readonly name = "redis";
  readonly remote = true;
  private key = process.env.REDIS_DB_KEY || "seatbadlo:db";

  constructor(
    private url: string,
    private token: string,
  ) {}

  private async cmd<T>(command: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`[store] redis ${command[0]} failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { result?: T; error?: string };
    if (data.error) throw new Error(`[store] redis ${command[0]}: ${data.error}`);
    return data.result as T;
  }

  async load(): Promise<Database | null> {
    const raw = await this.cmd<string | null>(["GET", this.key]);
    return raw ? (JSON.parse(raw) as Database) : null;
  }

  async save(db: Database): Promise<void> {
    await this.cmd(["SET", this.key, JSON.stringify(db)]);
  }
}

export function createStore(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return new RedisStore(url.replace(/\/$/, ""), token);
  if (IS_SERVERLESS && !process.env.DATA_FILE) {
    console.warn(
      "[store] Running on a serverless host without Redis. Data is stored in the temp directory and will NOT persist across deployments or instances. Add Upstash Redis (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) or Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN) for durable storage.",
    );
  }
  return new FileStore(process.env.DATA_FILE);
}
