import { logger } from "@/lib/logger";
import { contentConflict, contentNotFound, invalidContentState, isUniqueViolation } from "@/features/admin-content/errors";
import { findExam } from "@/features/admin-content/repository";
import { copyProductRecord, patchProduct, patchMaterial, unlinkProductRecord, archiveCatalogRecord, materialHasPublishedPackage, findCatalogTest, findLatestMaterialVersion, findMaterial, findProduct, findProductBundle, insertMaterial, insertProduct, insertProductLink, listCatalogExams, listMaterials, listProducts, publishMaterialRecord, publishProductRecord, appendMaterialFileVersion, type MaterialInput, type ProductInput, type ProductCreationInput, type StoredFileMetadata } from "./repository";
type Actor = { userId: string; requestId: string };
async function write<T>(action: string, actor: Actor, operation: () => Promise<T>) { try { const result = await operation(); logger.info({ requestId: actor.requestId, module: "admin-catalog", action, actorUserId: actor.userId }, "Admin catalog mutation completed"); return result; } catch (error) { if (isUniqueViolation(error)) throw contentConflict("This package already contains that item or uses an existing slug."); throw error; } }
export const getProducts = () => listProducts(); export const getMaterials = () => listMaterials(); export const getCatalogExams = () => listCatalogExams();
export async function getProduct(id: string) { const product = await findProductBundle(id); if (!product) throw contentNotFound("Product"); return product; }
export const createProduct = (input: ProductCreationInput, actor: Actor) => write("product_create", actor, () => insertProduct(input, { actorUserId: actor.userId, requestId: actor.requestId }));
export async function createMaterial(input: MaterialInput, actor: Actor) { if (!await findExam(input.examId)) throw contentNotFound("Exam"); if (input.type === "PDF" || input.type === "FILE") throw invalidContentState("Use the file upload form for PDF and downloadable materials."); return write("material_create", actor, () => insertMaterial(input, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function createUploadedMaterial(input: Omit<MaterialInput, "type" | "body" | "privateObjectKey"> & { type: "PDF" | "FILE" }, file: StoredFileMetadata, actor: Actor) { if (!await findExam(input.examId)) throw contentNotFound("Exam"); return write("material_file_create", actor, () => insertMaterial({ ...input, body: "", privateObjectKey: file.objectKey }, { actorUserId: actor.userId, requestId: actor.requestId }, file)); }
export async function uploadMaterialVersion(id: string, input: { title: string; allowDownload: boolean }, file: StoredFileMetadata, actor: Actor) { const before = await getMaterial(id); if (before.status !== "DRAFT") throw invalidContentState("Create an editable copy before replacing a published file."); return write("material_file_version", actor, () => appendMaterialFileVersion(before, file, input, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function publishMaterial(id: string, actor: Actor) { const before = await findMaterial(id); if (!before) throw contentNotFound("Material"); if (before.status !== "DRAFT") throw invalidContentState("Only draft materials can be published."); const exam = await findExam(before.examId); if (!exam || exam.status !== "PUBLISHED") throw invalidContentState("Publish the material's exam before publishing this material."); const version = await findLatestMaterialVersion(id); if ((before.type === "PDF" || before.type === "FILE") && (!version?.privateObjectKey || !version.checksum || !version.contentType || !version.originalFileName || !version.sizeBytes)) throw invalidContentState("Upload a valid file before publishing this material."); return write("material_publish", actor, () => publishMaterialRecord(before, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function linkProduct(id: string, kind: "TEST" | "MATERIAL", targetId: string, actor: Actor) { const product = await findProduct(id); if (!product) throw contentNotFound("Product"); if (product.status !== "DRAFT") throw invalidContentState("Published packages cannot be changed."); const target = kind === "TEST" ? await findCatalogTest(targetId) : await findMaterial(targetId); if (!target || target.status !== "PUBLISHED") throw invalidContentState(`Only published ${kind.toLowerCase()}s can be linked.`); return write("product_link", actor, () => insertProductLink(id, kind, targetId, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function publishProduct(id: string, actor: Actor) { const before = await getProduct(id); if (before.status !== "DRAFT") throw invalidContentState("Only draft packages can be published."); const usableTest = before.linkedTests.some((test) => test.status === "PUBLISHED" && test.examStatus === "PUBLISHED"); const usableMaterial = before.linkedMaterials.some((material) => material.status === "PUBLISHED"); if (before.linkedTests.some(test => test.status !== "PUBLISHED" || test.examStatus !== "PUBLISHED") || before.linkedMaterials.some(material => material.status !== "PUBLISHED")) throw invalidContentState("Remove unavailable items before publishing this package."); if (!usableTest && !usableMaterial) throw invalidContentState("Link at least one currently published test or material before publishing."); return write("product_publish", actor, () => publishProductRecord(before, { actorUserId: actor.userId, requestId: actor.requestId })); }

export async function updateProduct(id: string, input: ProductInput, actor: Actor) {
  const before = await findProduct(id); if (!before) throw contentNotFound("Product");
  if (before.status !== "DRAFT") throw invalidContentState("Only draft packages can be edited.");
  return write("product_update", actor, () => patchProduct(before, input, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function getMaterial(id: string) { const value = await findMaterial(id); if (!value) throw contentNotFound("Material"); return { ...value, latestVersion: await findLatestMaterialVersion(id) }; }
export async function updateMaterial(id: string, input: MaterialInput, actor: Actor) {
  const before = await getMaterial(id);
  if (before.status !== "DRAFT") throw invalidContentState("Create an editable copy of published material.");
  const exam = await findExam(input.examId); if (!exam || exam.status === "ARCHIVED") throw contentNotFound("Exam");
  return write("material_update", actor, () => patchMaterial(before, input, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function unlinkProduct(id: string, kind: "TEST" | "MATERIAL", targetId: string, actor: Actor) {
  const before = await findProduct(id); if (!before) throw contentNotFound("Product");
  if (before.status !== "DRAFT") throw invalidContentState("Only draft package contents can be changed.");
  return write("product_unlink", actor, () => unlinkProductRecord(id, kind, targetId, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function archiveCatalog(id: string, kind: "product" | "material", actor: Actor) {
  const before = kind === "product" ? await findProduct(id) : await findMaterial(id);
  if (!before) throw contentNotFound(kind === "product" ? "Product" : "Material");
  if (before.status === "ARCHIVED") throw invalidContentState("This item is already archived.");
  if (kind === "material" && await materialHasPublishedPackage(id)) throw invalidContentState("Archive the linked packages before archiving this material.");
  return write(`${kind}_archive`, actor, () => archiveCatalogRecord(id, kind, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function duplicateMaterial(id: string, actor: Actor) {
  const before = await getMaterial(id);
  return write("material_copy", actor, () => insertMaterial({ examId: before.examId, title: before.title.slice(0, 190) + " (copy)", type: before.type, body: before.body ?? "", privateObjectKey: before.privateObjectKey ?? "", allowDownload: before.allowDownload }, { actorUserId: actor.userId, requestId: actor.requestId }, before.latestVersion?.privateObjectKey ? { objectKey: before.latestVersion.privateObjectKey, originalFileName: before.latestVersion.originalFileName ?? "material", contentType: before.latestVersion.contentType ?? "application/octet-stream", checksum: before.latestVersion.checksum ?? "", sizeBytes: before.latestVersion.sizeBytes ?? 0 } : undefined));
}

export async function duplicateProduct(id: string, actor: Actor) {
  const before = await getProduct(id);
  return write("product_copy", actor, () => copyProductRecord(before, { actorUserId: actor.userId, requestId: actor.requestId }));
}
