import { AppError } from "@/lib/errors/app-error";

export const operationNotFound = (name: string) => new AppError("NOT_FOUND", `${name} was not found.`, 404);
export const closedTicket = () => new AppError("TICKET_CLOSED", "This support ticket is closed and cannot receive new replies.", 409);
export const currentSessionRevoke = () => new AppError("CURRENT_SESSION", "Use Sign out to end your current session.", 409);
