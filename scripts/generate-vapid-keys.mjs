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

// Extract the raw 32-byte private key from the PKCS#8 wrapper (last 32 bytes)
const privRaw = new Uint8Array(privPkcs8).slice(-32);

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
