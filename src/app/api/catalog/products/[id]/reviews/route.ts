import { z } from "zod";
import { requireStudent } from "@/features/auth/authorization";
import { upsertProductReview } from "@/features/catalog/repository";
import { AppError } from "@/lib/errors/app-error";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

const idSchema=z.uuid();const inputSchema=z.object({rating:z.coerce.number().int().min(1).max(5),comment:z.string().trim().min(3).max(1000)});
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return executeRoute(request,async requestId=>{const auth=await requireStudent();const input=inputSchema.parse(await request.json());const result=await upsertProductReview(idSchema.parse((await params).id),auth.user.id,input.rating,input.comment);if(!result)throw new AppError("PURCHASE_REQUIRED","Purchase this package before reviewing it.",403);return successResponse(result,requestId,{status:201});});}
