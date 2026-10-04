import { createHash } from "node:crypto";
import { privateStorage } from "./storage";
import { createMaterialToken, verifyMaterialToken } from "./tokens";
import { findStudentMaterial, findStudentMaterialForProduct, listStudentMaterials, logMaterialAccess } from "./repository";
import { invalidMaterialLink, materialDownloadDisabled, materialNotFound } from "./errors";
import { watermarkPdf } from "./watermark";

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
  const stored = await privateStorage().get(material.privateObjectKey);
  const checksum = createHash("sha256").update(stored.bytes).digest("hex");
  if (!material.checksum || checksum !== material.checksum) throw new Error("Stored material checksum mismatch.");
  const bytes = material.contentType === "application/pdf"
    ? await watermarkPdf(stored.bytes, `Licensed to ${user.name} (${user.email}) · ${new Date().toISOString().slice(0, 10)}`)
    : stored.bytes;
  await logMaterialAccess({ userId: user.id, materialId: material.id, productId: material.productId, versionId: material.versionId, entitlementId: material.entitlementId, accessSource: material.accessSource, action: payload.action, requestId: audit.requestId, ipHash: audit.ipHash });
  return { material, bytes };
}
