import crypto from "node:crypto";
import type { Database } from "./types";
import { seedDatabase } from "./seed";
import { todayYmd } from "./format";
import { createStore, type Store } from "./store";

/**
 * Database access. The whole dataset is one JSON document held in memory and
 * persisted through a Store adapter (file locally, Redis in production).
 * Every consumer goes through getDb() / mutate(), so swapping in a relational
 * database later means changing only this module and src/lib/store.ts.
 */
type G = typeof globalThis & {
  __sbStore?: Store;
  __sbDb?: Database;
  __sbLoading?: Promise<Database>;
  __sbLoadedAt?: number;
  __sbLastExpiry?: string;
};
const g = globalThis as G;

/** How long a remote (Redis) snapshot is trusted before re-reading it */
const REMOTE_STALE_MS = 3000;

function store(): Store {
  if (!g.__sbStore) {
    g.__sbStore = createStore();
    console.log(`[store] using ${g.__sbStore.name}`);
  }
  return g.__sbStore;
}

function emptyDb(): Database {
  return { users: [], listings: [], requests: [], notifications: [], otps: [] };
}

async function persist(db: Database) {
  try {
    await store().save(db);
  } catch (err) {
    // Never take the app down because storage is unavailable: keep serving from memory.
    console.error("[store] save failed, continuing in memory:", err);
  }
}

async function load(): Promise<Database> {
  const s = store();
  const loaded = await s.load().catch((err) => {
    console.error("[store] load failed, starting fresh in memory:", err);
    return null;
  });
  if (loaded) return { ...emptyDb(), ...loaded };
  const db = emptyDb();
  if (process.env.SEED_DEMO_DATA !== "false") seedDatabase(db);
  else db.seededAt = new Date().toISOString();
  await persist(db);
  return db;
}

async function expireOld(db: Database) {
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
  if (changed) await persist(db);
}

export async function getDb(): Promise<Database> {
  const stale = store().remote && g.__sbLoadedAt !== undefined && Date.now() - g.__sbLoadedAt > REMOTE_STALE_MS;
  if (!g.__sbDb || stale) {
    if (!g.__sbLoading) {
      g.__sbLoading = load().then((db) => {
        g.__sbDb = db;
        g.__sbLoadedAt = Date.now();
        g.__sbLoading = undefined;
        return db;
      });
    }
    await g.__sbLoading;
  }
  const db = g.__sbDb!;
  await expireOld(db);
  return db;
}

/**
 * Apply a change to the in-memory document and persist it. The callback
 * receives the same object graph the caller got from getDb(), so objects
 * looked up earlier in the request can be mutated directly.
 */
export async function mutate<T>(fn: (db: Database) => T): Promise<T> {
  const db = g.__sbDb ?? (await getDb());
  const result = fn(db);
  g.__sbLoadedAt = Date.now();
  await persist(db);
  return result;
}

export function newId(prefix = ""): string {
  return `${prefix}${crypto.randomBytes(9).toString("base64url")}`;
}
