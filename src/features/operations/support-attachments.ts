import { randomUUID } from "node:crypto";
import { privateStorage } from "@/features/materials/storage";
import { AppError } from "@/lib/errors/app-error";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export type SupportAttachment = { objectKey: string; fileName: string; contentType: string };

export async function storeSupportAttachment(ticketId: string, file: File | null): Promise<SupportAttachment | null> {
  if (!file || file.size === 0) return null;
  if (!allowed.has(file.type)) throw new AppError("SUPPORT_ATTACHMENT_TYPE", "Attach a JPG, PNG, WebP or PDF file.", 400);
  if (file.size > 5 * 1024 * 1024) throw new AppError("SUPPORT_ATTACHMENT_SIZE", "Support attachments must be smaller than 5 MB.", 400);
  const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectKey = `support/${ticketId}/${randomUUID()}.${extension}`;
  await privateStorage().put(objectKey, new Uint8Array(await file.arrayBuffer()), file.type);
  return { objectKey, fileName: file.name.slice(0, 255), contentType: file.type };
}

export async function removeSupportAttachment(attachment: SupportAttachment | null) {
  if (attachment) await privateStorage().delete(attachment.objectKey).catch(() => undefined);
}
