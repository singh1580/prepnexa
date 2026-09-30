import { randomUUID } from "node:crypto";
import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";
import { invalidContentState } from "@/features/admin-content/errors";
import { db } from "@/db/client";
import {
  auditLogs,
  materials,
  materialVersions,
  productMaterials,
  products,
  productTests,
  tests,
} from "@/db/schema";

type Audit = { actorUserId: string; requestId: string };
export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  mrpPaise?: number | null;
  pricePaise: number;
  accessDays: number;
};
export type MaterialInput = {
  title: string;
  type: "PDF" | "VIDEO" | "FILE";
  body: string;
  privateObjectKey: string;
  allowDownload?: boolean;
};
export type StoredFileMetadata = {
  objectKey: string;
  originalFileName: string;
  contentType: string;
  checksum: string;
  sizeBytes: number;
};
export function listProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      pricePaise: products.pricePaise,
      mrpPaise: products.mrpPaise,
      accessDays: products.accessDays,
      isLive: products.isLive,
      testCount: countDistinct(productTests.testId),
      materialCount: countDistinct(productMaterials.materialId),
    })
    .from(products)
    .leftJoin(productTests, eq(productTests.productId, products.id))
    .leftJoin(productMaterials, eq(productMaterials.productId, products.id))
    .groupBy(products.id)
    .orderBy(desc(products.updatedAt));
}
export function listMaterials() {
  return db
    .select({
      id: materials.id,
      title: materials.title,
      type: materials.type,
      allowDownload: materials.allowDownload,
      updatedAt: materials.updatedAt,
    })
    .from(materials)
    .orderBy(desc(materials.updatedAt));
}
export const findProduct = (id: string) =>
  db.query.products.findFirst({ where: eq(products.id, id) });
export const findMaterial = (id: string) =>
  db.query.materials.findFirst({ where: eq(materials.id, id) });
export async function findCatalogTest(id: string) {
  const [test] = await db
    .select({ id: tests.id })
    .from(tests)
    .where(eq(tests.id, id))
    .limit(1);
  return test;
}
export async function findProductBundle(id: string) {
  const product = await findProduct(id);
  if (!product) return undefined;
  const [linkedTests, linkedMaterials, availableTests, availableMaterials] =
    await Promise.all([
      db
        .select({
          id: tests.id,
          title: tests.title,
          mode: tests.mode,
        })
        .from(productTests)
        .innerJoin(tests, eq(productTests.testId, tests.id))
        .where(eq(productTests.productId, id)),
      db
        .select({
          id: materials.id,
          title: materials.title,
          type: materials.type,
        })
        .from(productMaterials)
        .innerJoin(materials, eq(productMaterials.materialId, materials.id))
        .where(eq(productMaterials.productId, id)),
      db
        .select({
          id: tests.id,
          title: tests.title,
          mode: tests.mode,
        })
        .from(tests)
        .orderBy(asc(tests.title)),
      db
        .select({
          id: materials.id,
          title: materials.title,
          type: materials.type,
        })
        .from(materials)
        .orderBy(asc(materials.title)),
    ]);
  return {
    ...product,
    linkedTests,
    linkedMaterials,
    availableTests,
    availableMaterials,
  };
}
export async function findIncompleteProductItems(id: string) {
  const result = await db.execute(sql`
    select
      coalesce((select jsonb_agg(t.title order by t.title) from ${productTests} pt join ${tests} t on t.id=pt.test_id
        where pt.product_id=${id} and not exists(select 1 from test_questions tq where tq.test_id=t.id)),'[]'::jsonb) as tests,
      coalesce((select jsonb_agg(m.title order by m.title) from ${productMaterials} pm join ${materials} m on m.id=pm.material_id
        where pm.product_id=${id} and not exists(select 1 from ${materialVersions} mv where mv.material_id=m.id)),'[]'::jsonb) as materials
  `);
  return (result.rows[0] ?? { tests: [], materials: [] }) as { tests: string[]; materials: string[] };
}
export async function listSellableItems() {
  const [testItems, materialItems] = await Promise.all([
    db
      .select({ id: tests.id, title: tests.title, mode: tests.mode })
      .from(tests)
      .orderBy(asc(tests.title)),
    db
      .select({
        id: materials.id,
        title: materials.title,
        type: materials.type,
      })
      .from(materials)
      .orderBy(asc(materials.title)),
  ]);
  return { tests: testItems, materials: materialItems };
}
export type ProductCreationInput = ProductInput & {
  testIds?: string[];
  materialIds?: string[];
};
export async function insertProduct(input: ProductCreationInput, audit: Audit) {
  const id = randomUUID();
  const testIds = [...new Set(input.testIds ?? [])],
    materialIds = [...new Set(input.materialIds ?? [])];
  const result = await db.execute(sql`
    with selected_tests as (select jsonb_array_elements_text(${JSON.stringify(testIds)}::jsonb)::uuid as id),
    selected_materials as (select jsonb_array_elements_text(${JSON.stringify(materialIds)}::jsonb)::uuid as id),
    created as (
      insert into products (id, name, slug, description, mrp_paise, price_paise, access_days, is_live)
      select ${id}::uuid, ${input.name}, ${input.slug}, ${input.description || null}, ${input.mrpPaise ?? null}, ${input.pricePaise}, ${input.accessDays}, false
      where not exists (select 1 from selected_tests s where not exists (
        select 1 from tests t where t.id = s.id
      )) and not exists (select 1 from selected_materials s where not exists (
        select 1 from materials m where m.id = s.id
      )) returning id
    ), linked_tests as (
      insert into product_tests (product_id, test_id) select p.id, t.id from created p cross join selected_tests t
    ), linked_materials as (
      insert into product_materials (product_id, material_id) select p.id, m.id from created p cross join selected_materials m
    )
    insert into audit_logs (actor_user_id, action, entity_type, entity_id, request_id, "after")
    select ${audit.actorUserId}::uuid, 'product.created', 'product', id::text, ${audit.requestId},
      ${JSON.stringify(input)}::jsonb from created returning entity_id
  `);
  if (!result.rows.length)
    throw invalidContentState(
      "One of the selected items is unavailable. Refresh and choose available content.",
    );
  return { id };
}
export async function insertMaterial(
  input: MaterialInput,
  audit: Audit,
  file?: StoredFileMetadata,
) {
  const id = randomUUID();
  const versionId = randomUUID();
  const now = new Date();
  const objectKey = (file?.objectKey ?? input.privateObjectKey) || null;
  const allowDownload = input.allowDownload ?? false;
  const values = {
    id,
    title: input.title,
    type: input.type,
    body: input.body || null,
    privateObjectKey: objectKey,
    allowDownload,
    createdBy: audit.actorUserId,
    createdAt: now,
    updatedAt: now,
  };
  await db.batch([
    db.insert(materials).values(values),
    db.insert(materialVersions).values({
      id: versionId,
      materialId: id,
      version: 1,
      title: input.title,
      body: input.body || null,
      privateObjectKey: objectKey,
      originalFileName: file?.originalFileName,
      contentType: file?.contentType,
      checksum: file?.checksum,
      sizeBytes: file?.sizeBytes,
      createdBy: audit.actorUserId,
      createdAt: now,
    }),
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: "material.created",
      entityType: "material",
      entityId: id,
      requestId: audit.requestId,
      after: {
        title: input.title,
        type: input.type,
        allowDownload,
        version: 1,
        file: file
          ? {
              originalFileName: file.originalFileName,
              contentType: file.contentType,
              checksum: file.checksum,
              sizeBytes: file.sizeBytes,
            }
          : undefined,
      },
    }),
  ]);
  return { id };
}
export async function findLatestMaterialVersion(materialId: string) {
  return db.query.materialVersions.findFirst({
    where: eq(materialVersions.materialId, materialId),
    orderBy: desc(materialVersions.version),
  });
}
export async function insertProductLink(
  productId: string,
  kind: "TEST" | "MATERIAL",
  targetId: string,
  audit: Audit,
) {
  const link =
    kind === "TEST"
      ? db.insert(productTests).values({ productId, testId: targetId })
      : db.insert(productMaterials).values({ productId, materialId: targetId });
  await db.batch([
    link,
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: `product.${kind.toLowerCase()}_linked`,
      entityType: "product",
      entityId: productId,
      requestId: audit.requestId,
      after: { kind, targetId },
    }),
  ]);
  return { productId, kind, targetId };
}
export async function setProductLiveRecord(
  before: NonNullable<Awaited<ReturnType<typeof findProductBundle>>>,
  isLive: boolean,
  audit: Audit,
) {
  const now = new Date();
  await db.batch([
    db
      .update(products)
      .set({ isLive, updatedAt: now })
      .where(eq(products.id, before.id)),
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: isLive ? "product.enabled" : "product.disabled",
      entityType: "product",
      entityId: before.id,
      requestId: audit.requestId,
      before: { isLive: before.isLive },
      after: { isLive },
    }),
  ]);
  return { id: before.id, isLive };
}

export async function patchProduct(
  before: NonNullable<Awaited<ReturnType<typeof findProduct>>>,
  input: ProductInput,
  audit: Audit,
) {
  await db.batch([
    db
      .update(products)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(products.id, before.id)),
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: "product.updated",
      entityType: "product",
      entityId: before.id,
      requestId: audit.requestId,
      before,
      after: input,
    }),
  ]);
  return { id: before.id };
}

export async function patchMaterial(
  before: NonNullable<Awaited<ReturnType<typeof findMaterial>>>,
  input: MaterialInput,
  audit: Audit,
) {
  const [latest] = await db
    .select({ version: materialVersions.version })
    .from(materialVersions)
    .where(eq(materialVersions.materialId, before.id))
    .orderBy(desc(materialVersions.version))
    .limit(1);
  const version = (latest?.version ?? 0) + 1;
  await db.batch([
    db
      .update(materials)
      .set({
        title: input.title,
        type: input.type,
        body: input.body || null,
        privateObjectKey: input.privateObjectKey || before.privateObjectKey,
        allowDownload: input.allowDownload ?? false,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, before.id)),
    db.insert(materialVersions).values({
      materialId: before.id,
      version,
      title: input.title,
      body: input.body || null,
      privateObjectKey: input.privateObjectKey || before.privateObjectKey,
      createdBy: audit.actorUserId,
    }),
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: "material.updated",
      entityType: "material",
      entityId: before.id,
      requestId: audit.requestId,
      before,
      after: { ...input, version },
    }),
  ]);
  return { id: before.id };
}

export async function appendMaterialFileVersion(
  before: NonNullable<Awaited<ReturnType<typeof findMaterial>>>,
  file: StoredFileMetadata,
  input: { title: string; allowDownload: boolean },
  audit: Audit,
) {
  const [latest] = await db
    .select({ version: materialVersions.version })
    .from(materialVersions)
    .where(eq(materialVersions.materialId, before.id))
    .orderBy(desc(materialVersions.version))
    .limit(1);
  const version = (latest?.version ?? 0) + 1;
  await db.batch([
    db
      .update(materials)
      .set({
        title: input.title,
        type: file.contentType === "application/pdf" ? "PDF" : "FILE",
        privateObjectKey: file.objectKey,
        allowDownload: input.allowDownload,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, before.id)),
    db.insert(materialVersions).values({
      materialId: before.id,
      version,
      title: input.title,
      privateObjectKey: file.objectKey,
      originalFileName: file.originalFileName,
      contentType: file.contentType,
      checksum: file.checksum,
      sizeBytes: file.sizeBytes,
      createdBy: audit.actorUserId,
    }),
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: "material.file_uploaded",
      entityType: "material",
      entityId: before.id,
      requestId: audit.requestId,
      after: {
        version,
        originalFileName: file.originalFileName,
        contentType: file.contentType,
        checksum: file.checksum,
        sizeBytes: file.sizeBytes,
      },
    }),
  ]);
  return { id: before.id, version };
}

export async function unlinkProductRecord(
  productId: string,
  kind: "TEST" | "MATERIAL",
  targetId: string,
  audit: Audit,
) {
  const remove =
    kind === "TEST"
      ? db
          .delete(productTests)
          .where(
            and(
              eq(productTests.productId, productId),
              eq(productTests.testId, targetId),
            ),
          )
      : db
          .delete(productMaterials)
          .where(
            and(
              eq(productMaterials.productId, productId),
              eq(productMaterials.materialId, targetId),
            ),
          );
  await db.batch([
    remove,
    db.insert(auditLogs).values({
      actorUserId: audit.actorUserId,
      action: "product.item_unlinked",
      entityType: "product",
      entityId: productId,
      requestId: audit.requestId,
      after: { kind, targetId },
    }),
  ]);
  return { id: productId };
}

export async function deleteMaterialRecord(id: string, audit: Audit) {
  const result = await db.execute(sql`
    with removed as (
      delete from ${materials} m where m.id=${id}
        and not exists(select 1 from ${productMaterials} pm where pm.material_id=m.id)
        and not exists(select 1 from material_access_logs l where l.material_id=m.id)
      returning m.id
    )
    insert into ${auditLogs}(actor_user_id,action,entity_type,entity_id,request_id,"after")
    select ${audit.actorUserId},'material.deleted','material',id::text,${audit.requestId},jsonb_build_object('deleted',true)
    from removed returning entity_id
  `);
  return result.rows.length ? { id } : undefined;
}


export async function copyProductRecord(
  before: NonNullable<Awaited<ReturnType<typeof findProductBundle>>>,
  audit: Audit,
) {
  const id = randomUUID();
  const values = {
    id,
    name: before.name.slice(0, 170) + " (copy)",
    slug: before.slug.slice(0, 145) + "-copy-" + id.slice(0, 8),
    description: before.description,
    mrpPaise: before.mrpPaise,
    pricePaise: before.pricePaise,
    accessDays: before.accessDays,
    isLive: false,
  };
  const create = db.insert(products).values(values);
  const auditEntry = db.insert(auditLogs).values({
    actorUserId: audit.actorUserId,
    action: "product.copied",
    entityType: "product",
    entityId: id,
    requestId: audit.requestId,
    after: { sourceProductId: before.id },
  });
  const testRows = before.linkedTests.map((test) => ({ productId: id, testId: test.id }));
  const materialRows = before.linkedMaterials.map((material) => ({ productId: id, materialId: material.id }));
  if (testRows.length && materialRows.length)
    await db.batch([
      create,
      db.insert(productTests).values(testRows),
      db.insert(productMaterials).values(materialRows),
      auditEntry,
    ]);
  else if (testRows.length)
    await db.batch([
      create,
      db.insert(productTests).values(testRows),
      auditEntry,
    ]);
  else if (materialRows.length)
    await db.batch([
      create,
      db.insert(productMaterials).values(materialRows),
      auditEntry,
    ]);
  else await db.batch([create, auditEntry]);
  return { id };
}

export async function deleteProductRecord(id: string, audit: Audit) {
  const result = await db.execute(sql`
    with removed as (
      delete from products p where p.id=${id}
        and not p.is_live
        and not exists(select 1 from order_items oi where oi.product_id=p.id)
        and not exists(select 1 from entitlements e where e.product_id=p.id)
      returning p.id
    )
    insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,"after")
    select ${audit.actorUserId},'product.deleted','product',id::text,${audit.requestId},jsonb_build_object('deleted',true)
    from removed returning entity_id
  `);
  return result.rows.length ? { id } : undefined;
}
