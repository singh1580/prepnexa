import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";

const run = process.env.RUN_MATERIALS_INTEGRATION === "true";
const timeout = Number(process.env.INTEGRATION_TIMEOUT_MS ?? 60_000);
const userId = randomUUID(); const examId = randomUUID(); const materialId = randomUUID(); const versionId = randomUUID();
const productId = randomUUID(); const orderId = randomUUID(); const entitlementId = randomUUID();
let objectKey: string | undefined;

describe.skipIf(!run)("protected material access flow", () => {
  afterAll(async () => {
    const [{ db }, schema, { eq, or }, { privateStorage }] = await Promise.all([import("../../src/db/client"), import("../../src/db/schema"), import("drizzle-orm"), import("../../src/features/materials/storage")]);
    await db.delete(schema.materialAccessLogs).where(eq(schema.materialAccessLogs.userId, userId));
    await db.delete(schema.entitlements).where(eq(schema.entitlements.id, entitlementId));
    await db.delete(schema.orders).where(eq(schema.orders.id, orderId));
    await db.delete(schema.productMaterials).where(eq(schema.productMaterials.productId, productId));
    await db.delete(schema.products).where(eq(schema.products.id, productId));
    await db.delete(schema.materials).where(eq(schema.materials.id, materialId));
    await db.delete(schema.exams).where(eq(schema.exams.id, examId));
    await db.delete(schema.auditLogs).where(or(eq(schema.auditLogs.actorUserId, userId), eq(schema.auditLogs.entityId, materialId)));
    await db.delete(schema.users).where(eq(schema.users.id, userId));
    if (objectKey) await privateStorage().delete(objectKey).catch(() => undefined);
  }, timeout * 2);

  it("delivers a watermarked entitled PDF, revokes access, then permits free access", async () => {
    const [{ db }, schema, materials, files, { privateStorage }, { eq }] = await Promise.all([import("../../src/db/client"), import("../../src/db/schema"), import("../../src/features/materials/service"), import("../../src/features/materials/files"), import("../../src/features/materials/storage"), import("drizzle-orm")]);
    const pdf = await PDFDocument.create(); pdf.addPage(); const raw = await pdf.save(); const copy = new Uint8Array(raw.byteLength); copy.set(raw);
    const file = await files.validateMaterialFile(new File([copy], "qa-guide.pdf", { type: "application/pdf" }), materialId); objectKey = file.objectKey;
    await privateStorage().put(file.objectKey, file.bytes, file.contentType);
    await db.insert(schema.users).values({ id: userId, email: `materials-${userId}@example.invalid`, name: "Material QA", passwordHash: "integration", status: "ACTIVE", emailVerifiedAt: new Date() });
    await db.insert(schema.exams).values({ id: examId, slug: `materials-${examId}`, name: "Material QA Exam", status: "PUBLISHED", createdBy: userId });
    await db.insert(schema.materials).values({ id: materialId, examId, title: "QA Guide", type: "PDF", privateObjectKey: file.objectKey, allowDownload: true, status: "PUBLISHED", createdBy: userId });
    await db.insert(schema.materialVersions).values({ id: versionId, materialId, version: 1, title: "QA Guide", privateObjectKey: file.objectKey, originalFileName: file.originalFileName, contentType: file.contentType, checksum: file.checksum, sizeBytes: file.sizeBytes, createdBy: userId, publishedAt: new Date() });
    await db.insert(schema.products).values({ id: productId, slug: `materials-${productId}`, name: "QA Material Pack", pricePaise: 10_000, accessDays: 30, status: "PUBLISHED" });
    await db.insert(schema.productMaterials).values({ productId, materialId });
    await db.insert(schema.orders).values({ id: orderId, userId, status: "PAID", subtotalPaise: 10_000, discountPaise: 0, totalPaise: 10_000, currency: "INR", idempotencyKey: `materials-${orderId}`, expiresAt: new Date(Date.now() + 3_600_000), paidAt: new Date() });
    await db.insert(schema.entitlements).values({ id: entitlementId, userId, productId, orderId, status: "ACTIVE", startsAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000) });
    expect(await materials.getStudentLibrary(userId)).toHaveLength(1);
    const token = await materials.createStudentMaterialLink(materialId, "VIEW", userId);
    const delivered = await materials.deliverStudentMaterial(token, { id: userId, name: "Material QA", email: `materials-${userId}@example.invalid` }, { requestId: randomUUID() });
    expect(delivered.bytes.byteLength).toBeGreaterThan(file.bytes.byteLength);
    expect(await db.select().from(schema.materialAccessLogs).where(eq(schema.materialAccessLogs.materialId, materialId))).toHaveLength(1);
    await db.update(schema.entitlements).set({ status: "REVOKED", revokedAt: new Date() }).where(eq(schema.entitlements.id, entitlementId));
    await expect(materials.getStudentMaterial(materialId, userId)).rejects.toMatchObject({ code: "MATERIAL_NOT_FOUND" });
    await db.update(schema.products).set({ pricePaise: 0 }).where(eq(schema.products.id, productId));
    expect((await materials.getStudentMaterial(materialId, userId)).accessSource).toBe("FREE");
  }, timeout * 12);
});
