import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createUploadedMaterial } from "@/features/admin-catalog/service";
import { materialUploadFieldsSchema } from "@/features/admin-catalog/validation";
import { validateMaterialFile } from "@/features/materials/files";
import { privateStorage } from "@/features/materials/storage";
import { AppError } from "@/lib/errors/app-error";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.manageMaterials);
    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File)) throw new AppError("MATERIAL_FILE_REQUIRED", "Choose a study material file.", 400);
    const input = materialUploadFieldsSchema.parse({ examId: form.get("examId"), title: form.get("title"), allowDownload: form.get("allowDownload") ?? "false" });
    const file = await validateMaterialFile(upload);
    const storage = privateStorage();
    await storage.put(file.objectKey, file.bytes, file.contentType);
    try {
      const result = await createUploadedMaterial({ ...input, type: file.materialType }, { objectKey: file.objectKey, originalFileName: file.originalFileName, contentType: file.contentType, checksum: file.checksum, sizeBytes: file.sizeBytes }, { userId: auth.user.id, requestId });
      return successResponse(result, requestId, { status: 201 });
    } catch (error) {
      await storage.delete(file.objectKey).catch(() => undefined);
      throw error;
    }
  });
}
