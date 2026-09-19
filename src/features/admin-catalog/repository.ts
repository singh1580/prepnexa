import { randomUUID } from "node:crypto";
import { and, asc, countDistinct, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, exams, materials, materialVersions, productMaterials, products, productTests, tests } from "@/db/schema";

type Audit = { actorUserId: string; requestId: string };
export type ProductInput = { name: string; slug: string; description: string; pricePaise: number; accessDays: number };
export type MaterialInput = { examId: string; title: string; type: "ARTICLE" | "PDF" | "VIDEO" | "FILE"; body: string; privateObjectKey: string };
export function listProducts() { return db.select({ id: products.id, name: products.name, slug: products.slug, pricePaise: products.pricePaise, accessDays: products.accessDays, status: products.status, testCount: countDistinct(productTests.testId), materialCount: countDistinct(productMaterials.materialId) }).from(products).leftJoin(productTests, eq(productTests.productId, products.id)).leftJoin(productMaterials, eq(productMaterials.productId, products.id)).groupBy(products.id).orderBy(desc(products.updatedAt)); }
export function listMaterials() { return db.select({ id: materials.id, title: materials.title, type: materials.type, status: materials.status, examName: exams.name }).from(materials).innerJoin(exams, eq(materials.examId, exams.id)).orderBy(desc(materials.updatedAt)); }
export const listCatalogExams = () => db.select({ id: exams.id, name: exams.name }).from(exams).where(ne(exams.status, "ARCHIVED")).orderBy(asc(exams.name));
export const findProduct = (id: string) => db.query.products.findFirst({ where: eq(products.id, id) });
export const findMaterial = (id: string) => db.query.materials.findFirst({ where: eq(materials.id, id) });
export async function findCatalogTest(id: string) { const [test] = await db.select({ id: tests.id, status: tests.status }).from(tests).innerJoin(exams, eq(tests.examId, exams.id)).where(and(eq(tests.id, id), eq(tests.status, "PUBLISHED"), eq(exams.status, "PUBLISHED"))).limit(1); return test; }
export async function findProductBundle(id: string) { const product = await findProduct(id); if (!product) return undefined; const [linkedTests, linkedMaterials, availableTests, availableMaterials] = await Promise.all([db.select({ id: tests.id, title: tests.title, mode: tests.mode, status: tests.status, examStatus: exams.status }).from(productTests).innerJoin(tests, eq(productTests.testId, tests.id)).innerJoin(exams, eq(tests.examId, exams.id)).where(eq(productTests.productId, id)), db.select({ id: materials.id, title: materials.title, type: materials.type, status: materials.status }).from(productMaterials).innerJoin(materials, eq(productMaterials.materialId, materials.id)).where(eq(productMaterials.productId, id)), db.select({ id: tests.id, title: tests.title, mode: tests.mode }).from(tests).innerJoin(exams, eq(tests.examId, exams.id)).where(and(eq(tests.status, "PUBLISHED"), eq(exams.status, "PUBLISHED"))).orderBy(asc(tests.title)), db.select({ id: materials.id, title: materials.title, type: materials.type }).from(materials).where(eq(materials.status, "PUBLISHED")).orderBy(asc(materials.title))]); return { ...product, linkedTests, linkedMaterials, availableTests, availableMaterials }; }
export async function insertProduct(input: ProductInput, audit: Audit) { const id = randomUUID(); const now = new Date(); await db.batch([db.insert(products).values({ id, ...input, description: input.description || null, status: "DRAFT", createdAt: now, updatedAt: now }), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "product.created", entityType: "product", entityId: id, requestId: audit.requestId, after: { ...input, status: "DRAFT" } })]); return { id }; }
export async function insertMaterial(input: MaterialInput, audit: Audit) { const id = randomUUID(); const versionId = randomUUID(); const now = new Date(); const values = { id, examId: input.examId, title: input.title, type: input.type, body: input.body || null, privateObjectKey: input.privateObjectKey || null, status: "DRAFT" as const, createdBy: audit.actorUserId, createdAt: now, updatedAt: now }; await db.batch([db.insert(materials).values(values), db.insert(materialVersions).values({ id: versionId, materialId: id, version: 1, title: input.title, body: input.body || null, privateObjectKey: input.privateObjectKey || null, createdBy: audit.actorUserId, createdAt: now }), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "material.created", entityType: "material", entityId: id, requestId: audit.requestId, after: { ...input, status: "DRAFT", version: 1 } })]); return { id }; }
export async function publishMaterialRecord(before: NonNullable<Awaited<ReturnType<typeof findMaterial>>>, audit: Audit) { const [latest] = await db.select({ id: materialVersions.id }).from(materialVersions).where(eq(materialVersions.materialId, before.id)).orderBy(desc(materialVersions.version)).limit(1); if (!latest) throw new Error("Material version invariant failed."); const now = new Date(); await db.batch([db.update(materials).set({ status: "PUBLISHED", updatedAt: now }).where(eq(materials.id, before.id)), db.update(materialVersions).set({ publishedAt: now }).where(eq(materialVersions.id, latest.id)), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "material.published", entityType: "material", entityId: before.id, requestId: audit.requestId, before: { status: before.status }, after: { status: "PUBLISHED", versionId: latest.id } })]); return { id: before.id, status: "PUBLISHED" as const }; }
export async function insertProductLink(productId: string, kind: "TEST" | "MATERIAL", targetId: string, audit: Audit) { const link = kind === "TEST" ? db.insert(productTests).values({ productId, testId: targetId }) : db.insert(productMaterials).values({ productId, materialId: targetId }); await db.batch([link, db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: `product.${kind.toLowerCase()}_linked`, entityType: "product", entityId: productId, requestId: audit.requestId, after: { kind, targetId } })]); return { productId, kind, targetId }; }
export async function publishProductRecord(before: NonNullable<Awaited<ReturnType<typeof findProductBundle>>>, audit: Audit) { const now = new Date(); await db.batch([db.update(products).set({ status: "PUBLISHED", updatedAt: now }).where(eq(products.id, before.id)), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "product.published", entityType: "product", entityId: before.id, requestId: audit.requestId, before: { status: before.status }, after: { status: "PUBLISHED" } })]); return { id: before.id, status: "PUBLISHED" as const }; }

export async function patchProduct(before: NonNullable<Awaited<ReturnType<typeof findProduct>>>, input: ProductInput, audit: Audit) {
  await db.batch([
    db.update(products).set({ ...input, updatedAt: new Date() }).where(and(eq(products.id, before.id), eq(products.status, "DRAFT"))),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "product.updated", entityType: "product", entityId: before.id, requestId: audit.requestId, before, after: input }),
  ]);
  return { id: before.id };
}

export async function patchMaterial(before: NonNullable<Awaited<ReturnType<typeof findMaterial>>>, input: MaterialInput, audit: Audit) {
  const [latest] = await db.select({ version: materialVersions.version }).from(materialVersions).where(eq(materialVersions.materialId, before.id)).orderBy(desc(materialVersions.version)).limit(1);
  const version = (latest?.version ?? 0) + 1;
  await db.batch([
    db.update(materials).set({ ...input, updatedAt: new Date() }).where(and(eq(materials.id, before.id), eq(materials.status, "DRAFT"))),
    db.insert(materialVersions).values({ materialId: before.id, version, title: input.title, body: input.body || null, privateObjectKey: input.privateObjectKey || null, createdBy: audit.actorUserId }),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "material.updated", entityType: "material", entityId: before.id, requestId: audit.requestId, before, after: { ...input, version } }),
  ]);
  return { id: before.id };
}

export async function unlinkProductRecord(productId: string, kind: "TEST" | "MATERIAL", targetId: string, audit: Audit) {
  const remove = kind === "TEST"
    ? db.delete(productTests).where(and(eq(productTests.productId, productId), eq(productTests.testId, targetId)))
    : db.delete(productMaterials).where(and(eq(productMaterials.productId, productId), eq(productMaterials.materialId, targetId)));
  await db.batch([remove, db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "product.item_unlinked", entityType: "product", entityId: productId, requestId: audit.requestId, after: { kind, targetId } })]);
  return { id: productId };
}

export async function materialHasPublishedPackage(id: string) {
  const rows = await db.select({ id: products.id }).from(productMaterials).innerJoin(products, eq(productMaterials.productId, products.id)).where(and(eq(productMaterials.materialId, id), eq(products.status, "PUBLISHED"))).limit(1);
  return rows.length > 0;
}

export async function archiveCatalogRecord(id: string, kind: "product" | "material", audit: Audit) {
  const table = kind === "product" ? products : materials;
  await db.batch([
    db.update(table).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(table.id, id)),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: `${kind}.archived`, entityType: kind, entityId: id, requestId: audit.requestId, after: { status: "ARCHIVED" } }),
  ]);
  return { id, status: "ARCHIVED" };
}

export async function copyProductRecord(before: NonNullable<Awaited<ReturnType<typeof findProductBundle>>>, audit: Audit) {
  const id = randomUUID();
  const values = { id, name: before.name.slice(0, 170) + " (copy)", slug: before.slug.slice(0, 145) + "-copy-" + id.slice(0, 8), description: before.description, pricePaise: before.pricePaise, accessDays: before.accessDays, status: "DRAFT" as const };
  const create = db.insert(products).values(values);
  const auditEntry = db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "product.copied", entityType: "product", entityId: id, requestId: audit.requestId, after: { sourceProductId: before.id } });
  const testRows = before.linkedTests.filter(test => test.status === "PUBLISHED").map(test => ({ productId: id, testId: test.id }));
  const materialRows = before.linkedMaterials.filter(material => material.status === "PUBLISHED").map(material => ({ productId: id, materialId: material.id }));
  if (testRows.length && materialRows.length) await db.batch([create, db.insert(productTests).values(testRows), db.insert(productMaterials).values(materialRows), auditEntry]);
  else if (testRows.length) await db.batch([create, db.insert(productTests).values(testRows), auditEntry]);
  else if (materialRows.length) await db.batch([create, db.insert(productMaterials).values(materialRows), auditEntry]);
  else await db.batch([create, auditEntry]);
  return { id };
}
