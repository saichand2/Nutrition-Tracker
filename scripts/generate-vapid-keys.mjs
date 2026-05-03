#!/usr/bin/env node
// Generates a VAPID key pair for Web Push notifications.
// Run: node scripts/generate-vapid-keys.mjs
// Then copy the output into your .env file and Supabase Edge Function secrets.

import { webcrypto } from "node:crypto";

const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
  { name: "ECDH", namedCurve: "P-256" },
  true,
  ["deriveKey"]
);

const pubRaw = await webcrypto.subtle.exportKey("raw", publicKey);
const privPkcs8 = await webcrypto.subtle.exportKey("pkcs8", privateKey);

// Find the 32-byte private scalar inside the PKCS#8 DER structure.
// It is the first OCTET STRING of exactly 32 bytes (tag 0x04, length 0x20).
const pkcs8Bytes = new Uint8Array(privPkcs8);
let privOffset = -1;
for (let i = 0; i < pkcs8Bytes.length - 33; i++) {
  if (pkcs8Bytes[i] === 0x04 && pkcs8Bytes[i + 1] === 0x20) {
    privOffset = i + 2;
    break;
  }
}
if (privOffset === -1) throw new Error("Could not locate private key bytes in PKCS#8 structure");
const privRaw = pkcs8Bytes.slice(privOffset, privOffset + 32);

const toBase64Url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const pub = toBase64Url(pubRaw);
const priv = toBase64Url(privRaw);

console.log("# ── Copy to your .env (front-end) ──────────────────────────");
console.log(`VITE_VAPID_PUBLIC_KEY=${pub}`);
console.log("");
console.log("# ── Set as Supabase Edge Function secrets ───────────────────");
console.log(`VAPID_PUBLIC_KEY=${pub}`);
console.log(`VAPID_PRIVATE_KEY=${priv}`);
console.log("VAPID_SUBJECT=mailto:your-email@example.com");
console.log("");
console.log("# In Supabase dashboard: Project Settings → Edge Functions → Secrets");
console.log("# CLI: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=...");
