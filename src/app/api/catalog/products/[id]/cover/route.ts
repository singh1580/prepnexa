import { getProductCover } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const cover = await getProductCover(catalogIdSchema.parse((await params).id));
    return new Response(Buffer.from(cover.bytes), {
      headers: {
        "Content-Type": cover.contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId,
      },
    });
  });
}
