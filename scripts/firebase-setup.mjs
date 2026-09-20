#!/usr/bin/env node
/**
 * One-shot Firebase Authentication setup for SeatBadlo (Phone sign-in).
 *
 * Applies, through the Identity Toolkit admin API, everything the Firebase
 * phone-auth guide asks you to click through in the console:
 *   - enable Phone Number sign-in
 *   - authorized domains (localhost, Vercel, Firebase Hosting)
 *   - SMS region policy: allow India (+91) only, to stop SMS abuse from abroad
 *   - fictional test numbers (+91 90000000xx -> 123456) so demo accounts work
 *
 * Needs a service account for the project with the "Firebase Admin" role:
 *   FIREBASE_SERVICE_ACCOUNT='<json or base64>' npm run firebase:setup
 *   or GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run firebase:setup
 */
import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "seatexchange-94e8b";
const DOMAINS = (process.env.AUTHORIZED_DOMAINS || "localhost,seatexchange-94e8b.firebaseapp.com,seatexchange-94e8b.web.app,seatexchange.vercel.app").split(",").map((d) => d.trim()).filter(Boolean);
const TEST_NUMBERS = { "+919000000001": "123456", "+919000000002": "123456", "+919000000009": "123456" };
const ALLOWED_REGIONS = (process.env.SMS_ALLOWED_REGIONS || "IN").split(",").map((r) => r.trim()).filter(Boolean);

function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return undefined;
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const sa = JSON.parse(text);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

const auth = new GoogleAuth({
  credentials: credentials(),
  scopes: ["https://www.googleapis.com/auth/cloud-platform", "https://www.googleapis.com/auth/firebase"],
});
const client = await auth.getClient();
const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;

const current = (await client.request({ url: base })).data;
const merged = {
  signIn: { phoneNumber: { enabled: true, testPhoneNumbers: { ...(current.signIn?.phoneNumber?.testPhoneNumbers || {}), ...TEST_NUMBERS } } },
  authorizedDomains: [...new Set([...(current.authorizedDomains || []), ...DOMAINS])],
  smsRegionConfig: { allowlistOnly: { allowedRegions: ALLOWED_REGIONS } },
};
const updateMask = "signIn.phoneNumber.enabled,signIn.phoneNumber.testPhoneNumbers,authorizedDomains,smsRegionConfig";
const updated = (await client.request({ url: `${base}?updateMask=${updateMask}`, method: "PATCH", data: merged })).data;

console.log(`Project ${PROJECT_ID}`);
console.log(`  Phone sign-in enabled: ${updated.signIn?.phoneNumber?.enabled}`);
console.log(`  Authorized domains:    ${(updated.authorizedDomains || []).join(", ")}`);
console.log(`  SMS regions allowed:   ${(updated.smsRegionConfig?.allowlistOnly?.allowedRegions || []).join(", ") || "(all)"}`);
console.log(`  Test phone numbers:    ${Object.keys(updated.signIn?.phoneNumber?.testPhoneNumbers || {}).join(", ")}`);
console.log("Done. Phone Authentication is ready.");
