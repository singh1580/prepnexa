import { AppError } from "@/lib/errors/app-error";

export const contentNotFound = (entity: "Exam" | "Subject" | "Topic") =>
  new AppError("CONTENT_NOT_FOUND", `${entity} was not found.`, 404);

export const contentConflict = (message: string) =>
  new AppError("CONTENT_CONFLICT", message, 409);

export function isUniqueViolation(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (typeof current === "object" && "code" in current && current.code === "23505") return true;
    current = typeof current === "object" && "cause" in current ? current.cause : undefined;
  }
  return false;
}
