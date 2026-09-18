import { createHmac, randomBytes } from "node:crypto";
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
