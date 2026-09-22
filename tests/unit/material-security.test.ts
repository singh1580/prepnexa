import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateMaterialFile } from "../../src/features/materials/files";
import { createMaterialToken, verifyMaterialToken } from "../../src/features/materials/tokens";
import { watermarkPdf } from "../../src/features/materials/watermark";

describe("protected material primitives", () => {
  it("accepts real PDFs, creates a checksum and rejects MIME spoofing", async () => {
    const document = await PDFDocument.create(); document.addPage();
    const bytes = await document.save();
    const fileBytes = new Uint8Array(bytes.byteLength); fileBytes.set(bytes);
    const valid = await validateMaterialFile(new File([fileBytes], "guide.pdf", { type: "application/pdf" }));
    expect(valid.materialType).toBe("PDF");
    expect(valid.checksum).toMatch(/^[a-f0-9]{64}$/);
    await expect(validateMaterialFile(new File(["not pdf"], "fake.pdf", { type: "application/pdf" }))).rejects.toMatchObject({ code: "INVALID_PDF" });
  });

  it("signs scoped expiring material links and rejects tampering", () => {
    const input = { userId: crypto.randomUUID(), materialId: crypto.randomUUID(), versionId: crypto.randomUUID(), action: "VIEW" as const };
    const token = createMaterialToken(input);
    expect(verifyMaterialToken(token)).toMatchObject(input);
    const [payload, signature] = token.split(".");
    expect(() => verifyMaterialToken(`${payload}x.${signature}`)).toThrow();
  });

  it("adds a visible watermark to every PDF page", async () => {
    const document = await PDFDocument.create(); document.addPage(); document.addPage();
    const original = await document.save();
    const result = await watermarkPdf(original, "Licensed learner");
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(2);
    expect(result.byteLength).toBeGreaterThan(original.byteLength);
  });
});
