import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors/app-error";
import { invalidMaterialLink } from "./errors";

export type MaterialTokenPayload = { userId: string; materialId: string; versionId: string; action: "VIEW" | "DOWNLOAD"; expiresAt: number };
const payloadSchema = z.object({ userId: z.uuid(), materialId: z.uuid(), versionId: z.uuid(), action: z.enum(["VIEW", "DOWNLOAD"]), expiresAt: z.number().int().positive() }).strict();

function signature(payload: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(`material-access:${payload}`).digest("base64url");
}

export function createMaterialToken(input: Omit<MaterialTokenPayload, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({ ...input, expiresAt: Math.floor(Date.now() / 1000) + env.MATERIAL_LINK_TTL_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyMaterialToken(token: string): MaterialTokenPayload {
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) throw invalidMaterialLink();
  const expected = signature(payload);
  const left = Buffer.from(supplied); const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw invalidMaterialLink();
  try {
    const value = payloadSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (value.expiresAt < Math.floor(Date.now() / 1000)) throw invalidMaterialLink();
    return value;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw invalidMaterialLink();
  }
}
