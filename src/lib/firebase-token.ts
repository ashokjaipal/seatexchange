import "server-only";
import { getAdminAuth } from "./firebase-admin";

export interface FirebaseIdentity {
  uid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
}

/**
 * Verifies a Firebase Authentication ID token with the Admin SDK. Only the
 * project ID is needed for this (public signing keys are fetched from Google),
 * so it works even before Firestore credentials are configured.
 */
export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdentity> {
  const auth = await getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid, phoneNumber: decoded.phone_number, email: decoded.email, name: typeof decoded.name === "string" ? decoded.name : undefined };
}
