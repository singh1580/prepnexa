import { AppError } from "@/lib/errors/app-error";

export const testNotFound = (entity: "Test" | "Section" | "Question") => new AppError("TEST_CONTENT_NOT_FOUND", `${entity} was not found.`, 404);
export const testStateConflict = (message: string) => new AppError("INVALID_TEST_STATE", message, 409);
