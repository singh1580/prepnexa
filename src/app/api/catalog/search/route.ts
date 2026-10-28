import { listAvailableProducts } from "@/features/catalog/repository";
import { matchesCatalogQuery } from "@/features/catalog/search";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request:Request){return executeRoute(request,async requestId=>{const q=new URL(request.url).searchParams.get("q")?.trim()??"";if(q.length<2)return successResponse([],requestId);const products=await listAvailableProducts();return successResponse(products.filter(product=>matchesCatalogQuery(product,q)).slice(0,6).map(({id,slug,name,pricePaise})=>({id,slug,name,pricePaise})),requestId);});}
