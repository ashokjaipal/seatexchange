import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Database } from "./types";
import { seedDatabase } from "./seed";
import { todayYmd } from "./format";

/**
 * A tiny JSON-file datastore. Good enough for a single-server MVP and demos.
 * Swap this module for Postgres/Prisma when going multi-instance: every
 * consumer only uses getDb() / mutate().
 */
const FILE = process.env.DATA_FILE || path.join(process.cwd(), "data", "db.json");

type G = typeof globalThis & { __sbDb?: Database; __sbLastExpiry?: string };
const g = globalThis as G;

function emptyDb(): Database {
  return { users: [], listings: [], requests: [], notifications: [], otps: [] };
}

function load(): Database {
  try {
    if (fs.existsSync(/* turbopackIgnore: true */ FILE)) {
      const raw = fs.readFileSync(/* turbopackIgnore: true */ FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<Database>;
      return { ...emptyDb(), ...parsed };
    }
  } catch (err) {
    console.error("[db] failed to read data file, starting fresh:", err);
  }
  const db = emptyDb();
  seedDatabase(db);
  persist(db);
  return db;
}

function persist(db: Database) {
  fs.mkdirSync(/* turbopackIgnore: true */ path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(/* turbopackIgnore: true */ tmp, JSON.stringify(db, null, 2));
  fs.renameSync(/* turbopackIgnore: true */ tmp, FILE);
}

function expireOld(db: Database) {
  const today = todayYmd();
  if (g.__sbLastExpiry === today) return;
  g.__sbLastExpiry = today;
  let changed = false;
  for (const l of db.listings) {
    if (l.status === "active" && l.journeyDate < today) {
      l.status = "expired";
      l.updatedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) persist(db);
}

export function getDb(): Database {
  if (!g.__sbDb) g.__sbDb = load();
  expireOld(g.__sbDb);
  return g.__sbDb;
}

export function mutate<T>(fn: (db: Database) => T): T {
  const db = getDb();
  const result = fn(db);
  persist(db);
  return result;
}

export function newId(prefix = ""): string {
  return `${prefix}${crypto.randomBytes(9).toString("base64url")}`;
}
