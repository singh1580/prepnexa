import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { exams, materials, productMaterials, products, productTests, subjects, tests } from "@/db/schema";

export async function listPublishedExams() {
  return db.select({ id: exams.id, slug: exams.slug, name: exams.name, description: exams.description, subjectCount: count(subjects.id) })
    .from(exams).leftJoin(subjects, eq(subjects.examId, exams.id)).where(eq(exams.status, "PUBLISHED"))
    .groupBy(exams.id).orderBy(asc(exams.name));
}
export async function findPublishedExam(slug: string) {
  const exam = await db.query.exams.findFirst({ where: and(eq(exams.slug, slug), eq(exams.status, "PUBLISHED")) });
  if (!exam) return null;
  const [subjectRows, testRows] = await Promise.all([
    db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.examId, exam.id)).orderBy(asc(subjects.sortOrder)),
    db.select({ id: tests.id, title: tests.title, mode: tests.mode, durationMinutes: tests.durationMinutes }).from(tests).where(and(eq(tests.examId, exam.id), eq(tests.status, "PUBLISHED"))).orderBy(asc(tests.title)),
  ]);
  return { ...exam, subjects: subjectRows, tests: testRows };
}
export async function listFreePublishedTests() {
  return db.selectDistinct({ id: tests.id, title: tests.title, durationMinutes: tests.durationMinutes, mode: tests.mode, examName: exams.name, examSlug: exams.slug })
    .from(tests).innerJoin(exams, eq(tests.examId, exams.id)).innerJoin(productTests, eq(productTests.testId, tests.id)).innerJoin(products, eq(products.id, productTests.productId))
    .where(and(eq(tests.status, "PUBLISHED"), eq(exams.status, "PUBLISHED"), eq(products.status, "PUBLISHED"), eq(products.pricePaise, 0))).orderBy(asc(exams.name), asc(tests.title));
}

export async function listPublishedProducts() {
  return db.select({ id: products.id, slug: products.slug, name: products.name, description: products.description, pricePaise: products.pricePaise, accessDays: products.accessDays, testCount: count(productTests.testId) })
    .from(products).leftJoin(productTests, eq(productTests.productId, products.id)).where(eq(products.status, "PUBLISHED"))
    .groupBy(products.id).orderBy(asc(products.pricePaise), asc(products.name));
}

export async function findPublishedProduct(slug: string) {
  const product = await db.query.products.findFirst({ where: and(eq(products.slug, slug), eq(products.status, "PUBLISHED")) });
  if (!product) return null;
  const [testRows, materialRows] = await Promise.all([
    db.select({ id: tests.id, title: tests.title, mode: tests.mode, durationMinutes: tests.durationMinutes, examName: exams.name }).from(productTests).innerJoin(tests, eq(tests.id, productTests.testId)).innerJoin(exams, eq(exams.id, tests.examId)).where(and(eq(productTests.productId, product.id), eq(tests.status, "PUBLISHED"), eq(exams.status, "PUBLISHED"))).orderBy(asc(exams.name), asc(tests.title)),
    db.select({ id: materials.id, title: materials.title, type: materials.type }).from(productMaterials).innerJoin(materials, eq(materials.id, productMaterials.materialId)).where(and(eq(productMaterials.productId, product.id), eq(materials.status, "PUBLISHED"))).orderBy(asc(materials.title)),
  ]);
  return { ...product, tests: testRows, materials: materialRows };
}
