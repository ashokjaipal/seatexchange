import "server-only";
import { firebaseConfig } from "./firebase";

/**
 * Firebase Admin SDK (server side only). Credentials, in order:
 *   FIREBASE_SERVICE_ACCOUNT        service account JSON (raw or base64) - use this on Vercel
 *   GOOGLE_APPLICATION_CREDENTIALS  path to a service account file (local / GCP)
 *   FIRESTORE_EMULATOR_HOST         local emulator, no credentials needed
 * Without any of these the app can still verify ID tokens (public keys only)
 * but cannot talk to Firestore.
 */
type AdminApp = import("firebase-admin/app").App;

type G = typeof globalThis & { __sbAdmin?: Promise<AdminApp> };
const g = globalThis as G;

export function firestoreConfigured(): boolean {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST);
}

function serviceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const sa = JSON.parse(text) as Record<string, string>;
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

export function getAdminApp(): Promise<AdminApp> {
  if (!g.__sbAdmin) {
    g.__sbAdmin = (async () => {
      const { initializeApp, getApps, cert, applicationDefault } = await import("firebase-admin/app");
      const existing = getApps()[0];
      if (existing) return existing;
      const sa = serviceAccount();
      const projectId = sa?.project_id || firebaseConfig.projectId;
      if (sa) return initializeApp({ credential: cert(sa), projectId });
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return initializeApp({ credential: applicationDefault(), projectId });
      // Emulator / token verification only: application default credentials (may log a harmless metadata lookup warning)
      return initializeApp({ projectId });
    })();
  }
  return g.__sbAdmin;
}

export async function getAdminFirestore() {
  const { getFirestore } = await import("firebase-admin/firestore");
  const db = getFirestore(await getAdminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() can only be called once per instance; ignore on hot reload
  }
  return db;
}

export async function getAdminAuth() {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getAdminApp());
}
