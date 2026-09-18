import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { env } from "@/config/env";

const argonOptions = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hashIdentifier(value: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(value).digest("hex");
}

export async function hashPassword(password: string) {
  return hash(`${password}\u0000${env.PASSWORD_PEPPER}`, argonOptions);
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, `${password}\u0000${env.PASSWORD_PEPPER}`, argonOptions);
}

export function createOpaqueToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashIdentifier(token) };
}

function mfaKey() {
  if (!env.MFA_ENCRYPTION_KEY) throw new Error("MFA_ENCRYPTION_KEY is not configured");
  return createHash("sha256").update(env.MFA_ENCRYPTION_KEY).digest();
}

export function encryptMfaSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", mfaKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptMfaSecret(payload: string) {
  const [version, iv, tag, encrypted] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Invalid MFA ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", mfaKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

export function createRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => `${randomBytes(3).toString("hex")}-${randomBytes(3).toString("hex")}`.toUpperCase());
}

export function hashRecoveryCode(code: string) {
  return hashIdentifier(`recovery:${code.replaceAll(" ", "").toUpperCase()}`);
}
