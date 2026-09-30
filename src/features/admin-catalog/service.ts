import { logger } from "@/lib/logger";
import {
  contentConflict,
  contentNotFound,
  invalidContentState,
  isUniqueViolation,
} from "@/features/admin-content/errors";
import {
  copyProductRecord,
  deleteMaterialRecord,
  patchProduct,
  patchMaterial,
  unlinkProductRecord,
  findCatalogTest,
  findLatestMaterialVersion,
  findIncompleteProductItems,
  findMaterial,
  findProduct,
  findProductBundle,
  insertMaterial,
  insertProduct,
  insertProductLink,
  listMaterials,
  listProducts,
  setProductLiveRecord,
  appendMaterialFileVersion,
  type MaterialInput,
  type ProductInput,
  type ProductCreationInput,
  type StoredFileMetadata,
} from "./repository";
type Actor = { userId: string; requestId: string };
async function write<T>(
  action: string,
  actor: Actor,
  operation: () => Promise<T>,
) {
  try {
    const result = await operation();
    logger.info(
      {
        requestId: actor.requestId,
        module: "admin-catalog",
        action,
        actorUserId: actor.userId,
      },
      "Admin catalog mutation completed",
    );
    return result;
  } catch (error) {
    if (isUniqueViolation(error))
      throw contentConflict(
        "This package already contains that item or uses an existing slug.",
      );
    throw error;
  }
}
export const getProducts = () => listProducts();
export const getMaterials = () => listMaterials();
export async function getProduct(id: string) {
  const product = await findProductBundle(id);
  if (!product) throw contentNotFound("Product");
  return product;
}
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
const withSlug = <T extends ProductInput>(input: T): T => ({ ...input, slug: input.slug || slugify(input.name) });
export const createProduct = (input: ProductCreationInput, actor: Actor) =>
  write("product_create", actor, () =>
    insertProduct(withSlug(input), {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
export async function createMaterial(input: MaterialInput, actor: Actor) {
  if (input.type === "PDF" || input.type === "FILE")
    throw invalidContentState(
      "Use the file upload form for PDF and downloadable materials.",
    );
  return write("material_create", actor, () =>
    insertMaterial(input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function createUploadedMaterial(
  input: Omit<MaterialInput, "type" | "body" | "privateObjectKey"> & {
    type: "PDF" | "FILE";
  },
  file: StoredFileMetadata,
  actor: Actor,
) {
  return write("material_file_create", actor, () =>
    insertMaterial(
      { ...input, body: "", privateObjectKey: file.objectKey },
      { actorUserId: actor.userId, requestId: actor.requestId },
      file,
    ),
  );
}
export async function uploadMaterialVersion(
  id: string,
  input: { title: string; allowDownload: boolean },
  file: StoredFileMetadata,
  actor: Actor,
) {
  const before = await getMaterial(id);
  return write("material_file_version", actor, () =>
    appendMaterialFileVersion(before, file, input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function linkProduct(
  id: string,
  kind: "TEST" | "MATERIAL",
  targetId: string,
  actor: Actor,
) {
  const product = await findProduct(id);
  if (!product) throw contentNotFound("Product");
  const target =
    kind === "TEST"
      ? await findCatalogTest(targetId)
      : await findMaterial(targetId);
  if (!target)
    throw invalidContentState(`This ${kind.toLowerCase()} is unavailable.`);
  return write("product_link", actor, () =>
    insertProductLink(id, kind, targetId, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function setProductLive(id: string, isLive: boolean, actor: Actor) {
  const before = await getProduct(id);
  if (isLive && !before.linkedTests.length && !before.linkedMaterials.length)
    throw invalidContentState(
      "Add at least one test, practice set or study material before making this package live.",
    );
  if (isLive) {
    const incomplete = await findIncompleteProductItems(id);
    if (incomplete.tests.length)
      throw invalidContentState(`Add questions to these tests before going live: ${incomplete.tests.join(", ")}.`);
    if (incomplete.materials.length)
      throw invalidContentState(`Complete these materials before going live: ${incomplete.materials.join(", ")}.`);
  }
  return write(isLive ? "product_enable" : "product_disable", actor, () =>
    setProductLiveRecord(before, isLive, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  actor: Actor,
) {
  const before = await findProduct(id);
  if (!before) throw contentNotFound("Product");
  return write("product_update", actor, () =>
    patchProduct(before, withSlug(input), {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function getMaterial(id: string) {
  const value = await findMaterial(id);
  if (!value) throw contentNotFound("Material");
  return { ...value, latestVersion: await findLatestMaterialVersion(id) };
}
export async function updateMaterial(
  id: string,
  input: MaterialInput,
  actor: Actor,
) {
  const before = await getMaterial(id);
  return write("material_update", actor, () =>
    patchMaterial(before, input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function deleteMaterial(id: string, actor: Actor) {
  const before = await findMaterial(id);
  if (!before) throw contentNotFound("Material");
  const result = await write("material_delete", actor, () =>
    deleteMaterialRecord(id, { actorUserId: actor.userId, requestId: actor.requestId }),
  );
  if (!result)
    throw invalidContentState(
      "Remove this material from every product package before deleting it. Previously accessed material must be retained for records.",
    );
  return result;
}
export async function unlinkProduct(
  id: string,
  kind: "TEST" | "MATERIAL",
  targetId: string,
  actor: Actor,
) {
  const before = await findProduct(id);
  if (!before) throw contentNotFound("Product");
  return write("product_unlink", actor, () =>
    unlinkProductRecord(id, kind, targetId, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function duplicateMaterial(id: string, actor: Actor) {
  const before = await getMaterial(id);
  return write("material_copy", actor, () =>
    insertMaterial(
      {
        title: before.title.slice(0, 190) + " (copy)",
        type: before.type,
        body: before.body ?? "",
        privateObjectKey: before.privateObjectKey ?? "",
        allowDownload: before.allowDownload,
      },
      { actorUserId: actor.userId, requestId: actor.requestId },
      before.latestVersion?.privateObjectKey
        ? {
            objectKey: before.latestVersion.privateObjectKey,
            originalFileName:
              before.latestVersion.originalFileName ?? "material",
            contentType:
              before.latestVersion.contentType ?? "application/octet-stream",
            checksum: before.latestVersion.checksum ?? "",
            sizeBytes: before.latestVersion.sizeBytes ?? 0,
          }
        : undefined,
    ),
  );
}

export async function duplicateProduct(id: string, actor: Actor) {
  const before = await getProduct(id);
  return write("product_copy", actor, () =>
    copyProductRecord(before, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
