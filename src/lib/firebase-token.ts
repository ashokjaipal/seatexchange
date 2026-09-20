import crypto from "node:crypto";
import { firebaseConfig } from "./firebase";

/**
 * Verifies a Firebase Authentication ID token on the server without the
 * Admin SDK or a service account: RS256 signature against Google's published
 * certificates plus the standard claim checks from the Firebase docs.
 */
const CERTS_URL = process.env.FIREBASE_CERTS_URL || "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type G = typeof globalThis & { __sbCerts?: { at: number; maxAge: number; certs: Record<string, string> } };
const g = globalThis as G;

async function certs(): Promise<Record<string, string>> {
  const c = g.__sbCerts;
  if (c && Date.now() - c.at < c.maxAge) return c.certs;
  const res = await fetch(CERTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`certs fetch failed: ${res.status}`);
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] ?? 3600) * 1000;
  const parsed = (await res.json()) as Record<string, string>;
  g.__sbCerts = { at: Date.now(), maxAge: Math.max(maxAge, 60_000), certs: parsed };
  return parsed;
}

export interface FirebaseIdentity {
  uid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
}

function b64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const header = JSON.parse(b64url(parts[0]).toString()) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unexpected token header");
  const cert = (await certs())[header.kid];
  if (!cert) throw new Error("Unknown signing key");
  const ok = crypto.verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), crypto.createPublicKey(cert), b64url(parts[2]));
  if (!ok) throw new Error("Invalid signature");

  const p = JSON.parse(b64url(parts[1]).toString()) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  const projectId = firebaseConfig.projectId;
  if (p.aud !== projectId) throw new Error("Token audience mismatch");
  if (p.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Token issuer mismatch");
  if (typeof p.sub !== "string" || !p.sub) throw new Error("Token subject missing");
  if (typeof p.exp !== "number" || p.exp <= now) throw new Error("Token expired");
  if (typeof p.iat !== "number" || p.iat > now + 300) throw new Error("Token issued in the future");
  if (typeof p.auth_time !== "number" || p.auth_time > now + 300) throw new Error("Invalid auth time");
  return {
    uid: p.sub,
    phoneNumber: typeof p.phone_number === "string" ? p.phone_number : undefined,
    email: typeof p.email === "string" ? p.email : undefined,
    name: typeof p.name === "string" ? p.name : undefined,
  };
}
