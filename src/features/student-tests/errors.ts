import { AppError } from "@/lib/errors/app-error";

export const studentTestNotFound = () => new AppError("TEST_NOT_FOUND", "This test is not available.", 404);
export const testAccessRequired = () => new AppError("TEST_ACCESS_REQUIRED", "This test is not included in your active access.", 403);
export const attemptNotFound = () => new AppError("ATTEMPT_NOT_FOUND", "This attempt was not found.", 404);
export const attemptConflict = (message: string) => new AppError("ATTEMPT_CONFLICT", message, 409);
export const attemptClosed = () => new AppError("ATTEMPT_CLOSED", "This attempt is already submitted.", 409);
export const attemptExpired = () => new AppError("ATTEMPT_EXPIRED", "The test time has ended. Your attempt has been submitted automatically.", 409);
export const staleAnswer = () => new AppError("STALE_ANSWER", "This answer changed in another tab. Refresh the attempt before saving again.", 409);
