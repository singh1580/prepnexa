import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function watermarkPdf(bytes: Uint8Array, label: string) {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: false });
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(9, Math.min(15, width / 42));
    const text = label.slice(0, 140);
    const textWidth = font.widthOfTextAtSize(text, size);
    for (const y of [height * 0.28, height * 0.58, height * 0.84]) {
      page.drawText(text, { x: Math.max(20, (width - textWidth) / 2), y, size, font, color: rgb(0.22, 0.42, 0.5), opacity: 0.16, rotate: degrees(18) });
    }
  }
  return document.save();
}
