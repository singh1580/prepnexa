import { cachedSearchAvailableProducts } from "@/features/catalog/repository";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
import { z } from "zod";

const searchQuery = z.string().trim().max(100);

export async function GET(request:Request){return executeRoute(request,async requestId=>{const q=searchQuery.parse(new URL(request.url).searchParams.get("q")??"");if(q.length<2)return successResponse([],requestId);return successResponse(await cachedSearchAvailableProducts(q),requestId);});}
