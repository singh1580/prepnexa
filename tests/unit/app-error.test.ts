import { describe,expect,it } from "vitest";
import { AppError } from "../../src/lib/errors/app-error";
describe("AppError",()=>{it("preserves safe error metadata",()=>{const error=new AppError("NOT_FOUND","Missing",404);expect(error.code).toBe("NOT_FOUND");expect(error.status).toBe(404)})});
