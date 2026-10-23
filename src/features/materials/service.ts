import { createHash } from "node:crypto";
import { privateStorage } from "./storage";
import { createMaterialToken, verifyMaterialToken } from "./tokens";
import { findStudentMaterial, findStudentMaterialForProduct, listStudentMaterials, logMaterialAccess } from "./repository";
import { invalidMaterialLink, materialDownloadDisabled, materialNotFound } from "./errors";
import { watermarkPdf } from "./watermark";
import { AppError } from "@/lib/errors/app-error";

const MAX_CACHE_BYTES = 48 * 1024 * 1024;
const MAX_CACHE_ENTRY_BYTES = 16 * 1024 * 1024;
const MAX_CONCURRENT_PREPARATIONS = 2;
const MAX_WAITING_PREPARATIONS = 20;
const PREPARATION_WAIT_TIMEOUT_MS = 15_000;
const preparedCache = new Map<string, Uint8Array>();
const preparationInFlight = new Map<string, Promise<Uint8Array>>();
type PreparationWaiter = { resolve: () => void; reject: (error: AppError) => void; timer: ReturnType<typeof setTimeout> };
const preparationWaiters: PreparationWaiter[] = [];
let preparedCacheBytes = 0;
let activePreparations = 0;

function readPrepared(key: string) {
  const bytes = preparedCache.get(key);
  if (!bytes) return undefined;
  preparedCache.delete(key);
  preparedCache.set(key, bytes);
  return bytes;
}

function cachePrepared(key: string, bytes: Uint8Array) {
  if (bytes.byteLength > MAX_CACHE_ENTRY_BYTES) return;
  const existing = preparedCache.get(key);
  if (existing) preparedCacheBytes -= existing.byteLength;
  preparedCache.delete(key);
  preparedCache.set(key, bytes);
  preparedCacheBytes += bytes.byteLength;
  while (preparedCacheBytes > MAX_CACHE_BYTES) {
    const oldest = preparedCache.entries().next().value as [string, Uint8Array] | undefined;
    if (!oldest) break;
    preparedCache.delete(oldest[0]);
    preparedCacheBytes -= oldest[1].byteLength;
  }
}

async function withPreparationSlot<T>(work: () => Promise<T>) {
  if (activePreparations >= MAX_CONCURRENT_PREPARATIONS) {
    if (preparationWaiters.length >= MAX_WAITING_PREPARATIONS) {
      throw new AppError("DOCUMENT_READER_BUSY", "The document reader is busy. Please try again in a moment.", 503);
    }
    await new Promise<void>((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        timer: setTimeout(() => {
          const index = preparationWaiters.indexOf(waiter);
          if (index >= 0) preparationWaiters.splice(index, 1);
          reject(new AppError("DOCUMENT_READER_BUSY", "The document reader is busy. Please try again in a moment.", 503));
        }, PREPARATION_WAIT_TIMEOUT_MS),
      };
      preparationWaiters.push(waiter);
    });
  }
  activePreparations += 1;
  try { return await work(); }
  finally {
    activePreparations -= 1;
    const next = preparationWaiters.shift();
    if (next) {
      clearTimeout(next.timer);
      next.resolve();
    }
  }
}

function maskedEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "verified learner";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, Math.min(6, local.length - visible.length)))}@${domain}`;
}

async function preparePdf(key: string, source: () => Promise<Uint8Array>) {
  const cached = readPrepared(key);
  if (cached) return cached;
  const existing = preparationInFlight.get(key);
  if (existing) return existing;
  const pending = withPreparationSlot(source).then(bytes => {
    cachePrepared(key, bytes);
    return bytes;
  }).finally(() => preparationInFlight.delete(key));
  preparationInFlight.set(key, pending);
  return pending;
}

export const getStudentLibrary = (userId: string) => listStudentMaterials(userId);

export async function getStudentMaterial(materialId: string, userId: string, productSlug?: string) {
  return await findStudentMaterial(materialId, userId, productSlug) ?? Promise.reject(materialNotFound());
}

export async function createStudentMaterialLink(materialId: string, action: "VIEW" | "DOWNLOAD", userId: string, productSlug?: string) {
  const material = await getStudentMaterial(materialId, userId, productSlug);
  if (material.type === "VIDEO" || !material.privateObjectKey) throw materialNotFound();
  if (action === "DOWNLOAD" && !material.allowDownload) throw materialDownloadDisabled();
  return createMaterialToken({ userId, materialId, productId: material.productId, versionId: material.versionId, action });
}

export async function deliverStudentMaterial(token: string, user: { id: string; name: string; email: string }, audit: { requestId: string; ipHash?: string }) {
  const payload = verifyMaterialToken(token);
  if (payload.userId !== user.id) throw invalidMaterialLink();
  const material = await findStudentMaterialForProduct(payload.materialId, user.id, payload.productId);
  if (!material || material.productId !== payload.productId) throw invalidMaterialLink();
  if (material.versionId !== payload.versionId || !material.privateObjectKey) throw invalidMaterialLink();
  if (payload.action === "DOWNLOAD" && !material.allowDownload) throw materialDownloadDisabled();
  const watermarkLabel = `Prepstore · Personal study copy · ${user.name} · ${maskedEmail(user.email)} · ${new Date().toISOString().slice(0, 10)}`;
  const preparedKey = createHash("sha256").update(`${material.versionId}:${user.id}:${watermarkLabel}`).digest("hex");
  const loadAndVerify = async () => {
    const stored = await privateStorage().get(material.privateObjectKey!);
    const checksum = createHash("sha256").update(stored.bytes).digest("hex");
    if (!material.checksum || checksum !== material.checksum) throw new Error("Stored material checksum mismatch.");
    return material.contentType === "application/pdf" ? watermarkPdf(stored.bytes, watermarkLabel) : stored.bytes;
  };
  const bytes = material.contentType === "application/pdf" ? await preparePdf(preparedKey, loadAndVerify) : await loadAndVerify();
  await logMaterialAccess({ userId: user.id, materialId: material.id, productId: material.productId, versionId: material.versionId, entitlementId: material.entitlementId, accessSource: material.accessSource, action: payload.action, requestId: audit.requestId, ipHash: audit.ipHash });
  return { material, bytes };
}
