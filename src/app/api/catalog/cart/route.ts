import { z } from "zod";
import { findCartProducts } from "@/features/catalog/repository";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
import { getCurrentAuth } from "@/features/auth/authorization";

const idsSchema=z.array(z.uuid()).max(20);
export async function GET(request:Request){return executeRoute(request,async requestId=>{const ids=idsSchema.parse(new URL(request.url).searchParams.getAll("id"));const auth=await getCurrentAuth();return successResponse(await findCartProducts(ids,auth?.user.id),requestId);});}
