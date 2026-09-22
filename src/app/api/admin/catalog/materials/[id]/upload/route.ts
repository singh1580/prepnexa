import { requirePermission } from "@/features/auth/authorization";
import { uploadMaterialVersion } from "@/features/admin-catalog/service";
import { catalogIdSchema, materialVersionUploadFieldsSchema } from "@/features/admin-catalog/validation";
import { validateMaterialFile } from "@/features/materials/files";
import { privateStorage } from "@/features/materials/storage";
import { AppError } from "@/lib/errors/app-error";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("material.manage");
    const id = catalogIdSchema.parse((await params).id);
    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File)) throw new AppError("MATERIAL_FILE_REQUIRED", "Choose a study material file.", 400);
    const input = materialVersionUploadFieldsSchema.parse({ title: form.get("title"), allowDownload: form.get("allowDownload") ?? "false" });
    const file = await validateMaterialFile(upload, id);
    const storage = privateStorage();
    await storage.put(file.objectKey, file.bytes, file.contentType);
    try {
      return successResponse(await uploadMaterialVersion(id, input, { objectKey: file.objectKey, originalFileName: file.originalFileName, contentType: file.contentType, checksum: file.checksum, sizeBytes: file.sizeBytes }, { userId: auth.user.id, requestId }), requestId);
    } catch (error) {
      await storage.delete(file.objectKey).catch(() => undefined);
      throw error;
    }
  });
}
