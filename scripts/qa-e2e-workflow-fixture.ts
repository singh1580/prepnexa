import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { validateMaterialFile } from "@/features/materials/files";
import { privateStorage } from "@/features/materials/storage";

type Fixture = {
  studentId: string;
  productId: string;
  productSlug: string;
  orderId: string;
  entitlementId: string;
  paymentId: string;
  materialId: string;
  materialVersionId: string;
  materialObjectKey: string;
  testId: string;
  sectionId: string;
  questionId: string;
  revisionId: string;
};

const fixturePath =
  process.env.E2E_WORKFLOW_FIXTURE ?? "/tmp/prepstore-workflow-fixture.json";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function createPdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const [index, heading] of [
    "Prepstore QA Study Guide",
    "Practice and Revision Notes",
  ].entries()) {
    const page = pdf.addPage([595.28, 841.89]);
    page.drawText(heading, {
      x: 58,
      y: 760,
      size: 24,
      font: bold,
      color: rgb(0.78, 0.24, 0.04),
    });
    page.drawText(`Protected reader verification - page ${index + 1}`, {
      x: 58,
      y: 715,
      size: 13,
      font,
      color: rgb(0.16, 0.18, 0.2),
    });
    page.drawText(
      "This synthetic document verifies full-page A4 rendering, navigation and responsive layout.",
      { x: 58, y: 675, size: 11, font, color: rgb(0.25, 0.28, 0.3) },
    );
  }
  return pdf.save();
}

async function seed() {
  const studentId = required("E2E_STUDENT_ID");
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.id, studentId),
    columns: { id: true },
  });
  if (!existing) throw new Error("E2E_STUDENT_ID does not identify a QA user.");

  // The configured account is disposable QA data. Clearing its old attempts
  // prevents an earlier interrupted run from blocking the one-active-attempt rule.
  await db.delete(schema.attempts).where(eq(schema.attempts.userId, studentId));

  const fixture: Fixture = {
    studentId,
    productId: randomUUID(),
    productSlug: `e2e-workflow-${randomUUID()}`,
    orderId: randomUUID(),
    entitlementId: randomUUID(),
    paymentId: randomUUID(),
    materialId: randomUUID(),
    materialVersionId: randomUUID(),
    materialObjectKey: "",
    testId: randomUUID(),
    sectionId: randomUUID(),
    questionId: randomUUID(),
    revisionId: randomUUID(),
  };

  const pdfBytes = await createPdf();
  const copy = new Uint8Array(pdfBytes.byteLength);
  copy.set(pdfBytes);
  const file = await validateMaterialFile(
    new File([copy], "prepstore-qa-study-guide.pdf", {
      type: "application/pdf",
    }),
    fixture.materialId,
  );
  fixture.materialObjectKey = file.objectKey;
  await privateStorage().put(file.objectKey, file.bytes, file.contentType);

  try {
    const tx = db;
      await tx.insert(schema.materials).values({
        id: fixture.materialId,
        title: "Prepstore QA Study Guide",
        subject: "Quality assurance",
        topic: "Protected reader",
        type: "PDF",
        privateObjectKey: file.objectKey,
        allowDownload: false,
        createdBy: studentId,
      });
      await tx.insert(schema.materialVersions).values({
        id: fixture.materialVersionId,
        materialId: fixture.materialId,
        version: 1,
        title: "Prepstore QA Study Guide",
        privateObjectKey: file.objectKey,
        originalFileName: file.originalFileName,
        contentType: file.contentType,
        checksum: file.checksum,
        sizeBytes: file.sizeBytes,
        createdBy: studentId,
      });
      await tx.insert(schema.questions).values({
        id: fixture.questionId,
        type: "SINGLE_CHOICE",
        stem: "Which number is half of ten?",
        marks: "1",
        negativeMarks: "0",
        difficulty: "EASY",
        createdBy: studentId,
      });
      await tx.insert(schema.questionRevisions).values({
        id: fixture.revisionId,
        questionId: fixture.questionId,
        version: 1,
        stem: "Which number is half of ten?",
        explanation: "Five is half of ten.",
        marks: "1",
        negativeMarks: "0",
        answerConfig: { correctKeys: ["B"] },
        createdBy: studentId,
      });
      await tx.insert(schema.questionRevisionOptions).values([
        {
          revisionId: fixture.revisionId,
          stableKey: "A",
          body: "4",
          isCorrect: false,
          sortOrder: 0,
        },
        {
          revisionId: fixture.revisionId,
          stableKey: "B",
          body: "5",
          isCorrect: true,
          sortOrder: 1,
        },
      ]);
      await tx.insert(schema.tests).values({
        id: fixture.testId,
        title: "Prepstore QA Autosave Test",
        mode: "MOCK",
        category: "TOPIC_SET",
        durationMinutes: 30,
        instructions: "Synthetic browser workflow verification.",
        maxAttempts: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
      });
      await tx.insert(schema.testSections).values({
        id: fixture.sectionId,
        testId: fixture.testId,
        title: "Questions",
        sortOrder: 0,
      });
      await tx.insert(schema.testQuestions).values({
        testId: fixture.testId,
        sectionId: fixture.sectionId,
        questionId: fixture.questionId,
        sortOrder: 0,
      });
      await tx.insert(schema.products).values({
        id: fixture.productId,
        slug: fixture.productSlug,
        name: "Prepstore QA Workflow Package",
        description: "Hidden synthetic browser QA fixture.",
        pricePaise: 100,
        accessDays: 30,
        isLive: false,
      });
      await tx.insert(schema.productMaterials).values({
        productId: fixture.productId,
        materialId: fixture.materialId,
      });
      await tx.insert(schema.productTests).values({
        productId: fixture.productId,
        testId: fixture.testId,
      });
      await tx.insert(schema.orders).values({
        id: fixture.orderId,
        userId: studentId,
        billingPhone: "9000000000",
        status: "PAID",
        subtotalPaise: 100,
        discountPaise: 0,
        taxPaise: 0,
        totalPaise: 100,
        currency: "INR",
        idempotencyKey: `e2e-workflow-${fixture.orderId}`,
        expiresAt: new Date(Date.now() + 3_600_000),
        paidAt: new Date(),
      });
      await tx.insert(schema.orderItems).values({
        orderId: fixture.orderId,
        productId: fixture.productId,
        productName: "Prepstore QA Workflow Package",
        unitPricePaise: 100,
        accessDays: 30,
        quantity: 1,
      });
      await tx.insert(schema.payments).values({
        id: fixture.paymentId,
        orderId: fixture.orderId,
        provider: "mock",
        providerOrderId: `qa-order-${fixture.orderId}`,
        providerPaymentId: `qa-payment-${fixture.paymentId}`,
        idempotencyKey: `e2e-payment-${fixture.paymentId}`,
        status: "CAPTURED",
        amountPaise: 100,
        currency: "INR",
        verifiedAt: new Date(),
      });
      await tx.insert(schema.entitlements).values({
        id: fixture.entitlementId,
        userId: studentId,
        productId: fixture.productId,
        orderId: fixture.orderId,
        status: "ACTIVE",
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
      });
    await writeFile(fixturePath, JSON.stringify(fixture), { mode: 0o600 });
    process.stdout.write(`Workflow fixture created at ${fixturePath}.\n`);
  } catch (error) {
    await privateStorage().delete(file.objectKey).catch(() => undefined);
    throw error;
  }
}

async function cleanup() {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as Fixture;
  const tx = db;
    await tx
      .delete(schema.materialAccessLogs)
      .where(eq(schema.materialAccessLogs.materialId, fixture.materialId));
    await tx
      .delete(schema.attempts)
      .where(
        and(
          eq(schema.attempts.userId, fixture.studentId),
          eq(schema.attempts.productId, fixture.productId),
        ),
      );
    await tx
      .delete(schema.entitlements)
      .where(eq(schema.entitlements.id, fixture.entitlementId));
    await tx
      .delete(schema.payments)
      .where(eq(schema.payments.id, fixture.paymentId));
    await tx.delete(schema.orders).where(eq(schema.orders.id, fixture.orderId));
    await tx
      .delete(schema.products)
      .where(eq(schema.products.id, fixture.productId));
    await tx
      .delete(schema.materials)
      .where(eq(schema.materials.id, fixture.materialId));
    await tx.delete(schema.tests).where(eq(schema.tests.id, fixture.testId));
    await tx
      .delete(schema.questions)
      .where(eq(schema.questions.id, fixture.questionId));
    await tx
      .delete(schema.auditLogs)
      .where(
        inArray(schema.auditLogs.entityId, [
          fixture.productId,
          fixture.orderId,
          fixture.materialId,
          fixture.testId,
        ]),
      );
  await privateStorage()
    .delete(fixture.materialObjectKey)
    .catch(() => undefined);
  process.stdout.write("Workflow fixture removed.\n");
}

async function main() {
  const action = process.argv[2];
  if (action === "seed") await seed();
  else if (action === "cleanup") await cleanup();
  else throw new Error("Use seed or cleanup.");
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Workflow fixture failed."}\n`,
  );
  process.exitCode = 1;
});
