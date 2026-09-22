import { AppError } from "@/lib/errors/app-error";
export const resultNotFound = () => new AppError("RESULT_NOT_FOUND", "This result is not available.", 404);
export const resultNotReady = () => new AppError("RESULT_NOT_READY", "This attempt has not been submitted yet.", 409);
