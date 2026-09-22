import { env } from "@/config/env";
import { LocalPrivateStorage } from "./local";
import { S3PrivateStorage } from "./s3";
import type { PrivateObjectStorage } from "./types";

let instance: PrivateObjectStorage | undefined;

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required when STORAGE_PROVIDER=s3.`);
  return value;
}

export function privateStorage(): PrivateObjectStorage {
  if (instance) return instance;
  if (env.STORAGE_PROVIDER === "local") {
    if (env.NODE_ENV === "production") throw new Error("Local object storage is disabled in production.");
    instance = new LocalPrivateStorage(env.STORAGE_LOCAL_ROOT);
    return instance;
  }
  instance = new S3PrivateStorage(required(env.STORAGE_BUCKET, "STORAGE_BUCKET"), {
    region: required(env.STORAGE_REGION, "STORAGE_REGION"),
    endpoint: env.STORAGE_ENDPOINT_URL,
    accessKeyId: required(env.STORAGE_ACCESS_KEY_ID, "STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: required(env.STORAGE_SECRET_ACCESS_KEY, "STORAGE_SECRET_ACCESS_KEY"),
  });
  return instance;
}

export type { PrivateObjectStorage } from "./types";
