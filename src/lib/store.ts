import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Database } from "./types";
import { firestoreConfigured, getAdminFirestore } from "./firebase-admin";

/**
 * Storage adapters for the whole database document.
 *
 *  - FileStore: a JSON file on disk. Default for local development. On
 *    serverless hosts (Vercel, Netlify, Lambda) the project directory is
 *    read-only, so it falls back to the OS temp directory. That keeps the
 *    app running but data is ephemeral there, so use RedisStore in production.
 *  - FirestoreStore: Cloud Firestore via the Admin SDK. One document per
 *    user / listing / request / notification / otp in top-level collections,
 *    so the data is browsable and queryable in the Firebase console. Enabled
 *    when Firebase credentials (or the emulator) are configured.
 *  - RedisStore: Upstash Redis / Vercel KV over their REST API. The whole
 *    document under one key.
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

type Collection = "users" | "listings" | "requests" | "notifications" | "otps";
const COLLECTIONS: Collection[] = ["users", "listings", "requests", "notifications", "otps"];
const META_DOC = "meta/db";

export class FirestoreStore implements Store {
  readonly name = `firestore:${process.env.FIRESTORE_EMULATOR_HOST ? "emulator" : "cloud"}`;
  readonly remote = true;
  /** JSON of every document as last seen, so save() writes only what changed */
  private snapshot = new Map<Collection, Map<string, string>>();

  private idOf(col: Collection, item: Record<string, unknown>): string {
    return col === "otps" ? String(item.mobile) : String(item.id);
  }

  async load(): Promise<Database | null> {
    const fs = await getAdminFirestore();
    const [meta, ...snaps] = await Promise.all([fs.doc(META_DOC).get(), ...COLLECTIONS.map((c) => fs.collection(c).get())]);
    if (!meta.exists && snaps.every((s) => s.empty)) return null;
    const db: Database = { users: [], listings: [], requests: [], notifications: [], otps: [], seededAt: (meta.data()?.seededAt as string | undefined) ?? undefined };
    COLLECTIONS.forEach((col, i) => {
      const map = new Map<string, string>();
      for (const d of snaps[i].docs) {
        const data = d.data() as Record<string, unknown>;
        map.set(d.id, JSON.stringify(data));
        (db[col] as unknown[]).push(data);
      }
      this.snapshot.set(col, map);
    });
    // Notifications are consumed newest-first
    db.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return db;
  }

  async save(db: Database): Promise<void> {
    const fs = await getAdminFirestore();
    const ops: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
    const next = new Map<Collection, Map<string, string>>();
    for (const col of COLLECTIONS) {
      const prev = this.snapshot.get(col) ?? new Map<string, string>();
      const cur = new Map<string, string>();
      for (const item of db[col] as unknown as Record<string, unknown>[]) {
        const id = this.idOf(col, item);
        const json = JSON.stringify(item);
        cur.set(id, json);
        if (prev.get(id) !== json) ops.push((b) => b.set(fs.collection(col).doc(id), JSON.parse(json)));
      }
      for (const id of prev.keys()) if (!cur.has(id)) ops.push((b) => b.delete(fs.collection(col).doc(id)));
      next.set(col, cur);
    }
    if (!this.snapshot.size || db.seededAt) ops.push((b) => b.set(fs.doc(META_DOC), { seededAt: db.seededAt ?? null, updatedAt: new Date().toISOString() }, { merge: true }));
    // Firestore batches take at most 500 writes
    for (let i = 0; i < ops.length; i += 450) {
      const batch = fs.batch();
      ops.slice(i, i + 450).forEach((op) => op(batch));
      await batch.commit();
    }
    this.snapshot = next;
  }
}

export function createStore(): Store {
  if (firestoreConfigured()) return new FirestoreStore();
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return new RedisStore(url.replace(/\/$/, ""), token);
  if (IS_SERVERLESS && !process.env.DATA_FILE) {
    console.warn(
      "[store] Running on a serverless host without Firestore or Redis. Data is stored in the temp directory and will NOT persist across deployments or instances. Set FIREBASE_SERVICE_ACCOUNT (Firestore) or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Redis) for durable storage.",
    );
  }
  return new FileStore(process.env.DATA_FILE);
}
