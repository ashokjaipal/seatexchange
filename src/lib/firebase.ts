/**
 * Firebase web SDK (client side). The web config is public by design; it
 * identifies the project, it does not grant access. Override per environment
 * with NEXT_PUBLIC_FIREBASE_* variables.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAtnmNGBrKwCEL4hvTsaNpl_Zy-bOZhpPY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "seatexchange1207.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "seatexchange1207",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "seatexchange1207.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "811799655751",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:811799655751:web:0789154c5d86533538c862",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KWLFP51MTJ",
};

export const hasFirebaseConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

import type { FirebaseApp } from "firebase/app";
import type { Analytics } from "firebase/analytics";
import type { Auth } from "firebase/auth";

let app: FirebaseApp | undefined;
let analytics: Analytics | null | undefined;
let auth: Auth | undefined;

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!app) {
    const { initializeApp, getApps } = await import("firebase/app");
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

/** Browser only. Resolves to null where Analytics is unsupported (SSR, some in-app browsers). */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analytics !== undefined) return analytics;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    analytics = (await isSupported()) ? getAnalytics(await getFirebaseApp()) : null;
  } catch {
    analytics = null;
  }
  return analytics;
}

/** Set NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 to sign in against the local Auth emulator. */
const AUTH_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth) {
    const { getAuth, connectAuthEmulator } = await import("firebase/auth");
    auth = getAuth(await getFirebaseApp());
    // Localise reCAPTCHA and the SMS text to the device language (Hindi, Tamil, ... where Firebase supports it)
    auth.useDeviceLanguage();
    if (AUTH_EMULATOR) connectAuthEmulator(auth, `http://${AUTH_EMULATOR}`, { disableWarnings: true });
  }
  return auth;
}

/** Fire-and-forget product analytics event. Safe to call anywhere on the client. */
export function track(event: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  getFirebaseAnalytics()
    .then(async (a) => {
      if (!a) return;
      const { logEvent } = await import("firebase/analytics");
      logEvent(a, event, params);
    })
    .catch(() => {});
}
