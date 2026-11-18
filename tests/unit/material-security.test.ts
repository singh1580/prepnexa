import { describe, expect, it } from "vitest";
import { PDFArray, PDFDocument, PDFName, PDFString } from "pdf-lib";
import { validateMaterialFile } from "../../src/features/materials/files";
import { createMaterialToken, verifyMaterialToken } from "../../src/features/materials/tokens";
import { watermarkPdf } from "../../src/features/materials/watermark";
import { readFileSync } from "node:fs";

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
    const input = { userId: crypto.randomUUID(), materialId: crypto.randomUUID(), productId: crypto.randomUUID(), versionId: crypto.randomUUID(), action: "VIEW" as const };
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

  it("preserves reference-link annotations while adding the watermark", async () => {
    const document = await PDFDocument.create();
    const page = document.addPage([600, 800]);
    const annotation = document.context.register(document.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [50, 700, 260, 725],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of("https://example.com/reference"),
      },
    }));
    page.node.set(PDFName.of("Annots"), document.context.obj([annotation]));

    const result = await watermarkPdf(await document.save(), "Licensed learner");
    const loaded = await PDFDocument.load(result);
    const annotations = loaded
      .getPage(0)
      .node.lookup(PDFName.of("Annots"), PDFArray);
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(result) });
    const renderedDocument = await loadingTask.promise;
    const renderedAnnotations = await (
      await renderedDocument.getPage(1)
    ).getAnnotations({ intent: "display" });

    expect(annotations.size()).toBe(1);
    expect(renderedAnnotations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://example.com/reference" }),
      ]),
    );
    await loadingTask.destroy();
  });

  it("labels delivered copies for personal study without exposing a full email address", () => {
    const source = readFileSync("src/features/materials/service.ts", "utf8");
    expect(source).toContain("Personal study copy");
    expect(source).toContain("maskedEmail(user.email)");
    expect(source).not.toContain("Licensed to");
    expect(source).toContain("MAX_CONCURRENT_PREPARATIONS");
    expect(source).toContain("MAX_CACHE_BYTES");
    expect(source).toContain("preparationInFlight");
  });
});
