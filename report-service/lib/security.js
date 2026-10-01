import { createHmac, timingSafeEqual } from "node:crypto";

function hmacHex(key, message) {
  return createHmac("sha256", key).update(message).digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

// The Dino report_relay plugin signs the raw request body with RELAY_KEY.
export function verifyRelaySignature(rawBody, signature) {
  return Boolean(signature) && safeEqual(hmacHex(requireEnv("RELAY_KEY"), rawBody), signature);
}

// Upload links carry a per-report token so only email recipients can add photos.
export function uploadToken(reportId) {
  return hmacHex(requireEnv("LINK_SECRET"), `upload:${reportId}`).slice(0, 32);
}

export function verifyUploadToken(reportId, token) {
  return Boolean(reportId && token) && safeEqual(uploadToken(reportId), token);
}

const REPORT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isReportId(value) {
  return REPORT_ID.test(String(value || ""));
}
