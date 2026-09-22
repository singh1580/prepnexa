import { AppError } from "@/lib/errors/app-error";

export const materialNotFound = () => new AppError("MATERIAL_NOT_FOUND", "This study material is not available.", 404);
export const materialDownloadDisabled = () => new AppError("MATERIAL_DOWNLOAD_DISABLED", "This material can only be viewed online.", 403);
export const invalidMaterialLink = () => new AppError("INVALID_MATERIAL_LINK", "This material link is invalid or has expired.", 403);
