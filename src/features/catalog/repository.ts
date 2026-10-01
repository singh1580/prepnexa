import { and, asc, countDistinct, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { materials, productMaterials, products, productTests, tests } from "@/db/schema";

export async function listAvailableProducts() {
  return db.select({ id: products.id, slug: products.slug, name: products.name, description: products.description, mrpPaise: products.mrpPaise, pricePaise: products.pricePaise, accessDays: products.accessDays, testCount: countDistinct(productTests.testId), materialCount: countDistinct(productMaterials.materialId) })
    .from(products).leftJoin(productTests, eq(productTests.productId, products.id)).leftJoin(productMaterials, eq(productMaterials.productId, products.id)).where(eq(products.isLive, true))
    .groupBy(products.id).orderBy(asc(products.pricePaise), asc(products.name));
}

export async function findAvailableProduct(slug: string) {
  const product = await db.query.products.findFirst({ where: and(eq(products.slug, slug), eq(products.isLive, true)) });
  if (!product) return null;
  const [testRows, materialRows] = await Promise.all([
    db.select({ id: tests.id, title: tests.title, mode: tests.mode, durationMinutes: tests.durationMinutes, examName: products.name }).from(productTests).innerJoin(tests, eq(tests.id, productTests.testId)).innerJoin(products, eq(products.id, productTests.productId)).where(eq(productTests.productId, product.id)).orderBy(asc(tests.title)),
    db.select({ id: materials.id, title: materials.title, type: materials.type }).from(productMaterials).innerJoin(materials, eq(materials.id, productMaterials.materialId)).where(eq(productMaterials.productId, product.id)).orderBy(asc(materials.title)),
  ]);
  return { ...product, tests: testRows, materials: materialRows };
}
