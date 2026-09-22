import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors/app-error";

const allowedTypes = new Map([
  ["application/pdf", "pdf"],
  ["application/zip", "zip"],
  ["text/plain", "txt"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
]);

export type ValidMaterialFile = {
  bytes: Uint8Array;
  contentType: string;
  originalFileName: string;
  checksum: string;
  sizeBytes: number;
  objectKey: string;
  materialType: "PDF" | "FILE";
};

export async function validateMaterialFile(file: File, materialId: string = randomUUID()): Promise<ValidMaterialFile> {
  const contentType = file.type.toLowerCase();
  const extension = allowedTypes.get(contentType);
  if (!extension) throw new AppError("UNSUPPORTED_MATERIAL_FILE", "Upload a PDF, ZIP, TXT, DOCX or PPTX file.", 400);
  if (file.size < 1) throw new AppError("EMPTY_MATERIAL_FILE", "The selected file is empty.", 400);
  if (file.size > env.STORAGE_MAX_FILE_MB * 1024 * 1024) throw new AppError("MATERIAL_FILE_TOO_LARGE", `Files can be up to ${env.STORAGE_MAX_FILE_MB} MB.`, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (contentType === "application/pdf" && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new AppError("INVALID_PDF", "The selected file is not a valid PDF.", 400);
  }
  if (contentType === "application/pdf") {
    try { await PDFDocument.load(bytes, { ignoreEncryption: false }); }
    catch { throw new AppError("INVALID_PDF", "Upload a valid, unencrypted PDF.", 400); }
  }
  const safeBase = path.basename(file.name).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-180) || `material.${extension}`;
  const checksum = createHash("sha256").update(bytes).digest("hex");
  return {
    bytes,
    contentType,
    originalFileName: safeBase,
    checksum,
    sizeBytes: bytes.byteLength,
    objectKey: `materials/${materialId}/${randomUUID()}.${extension}`,
    materialType: contentType === "application/pdf" ? "PDF" : "FILE",
  };
}
