import { getProductCover } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cover = await getProductCover(catalogIdSchema.parse((await params).id));
  return new Response(Buffer.from(cover.bytes), {
    headers: {
      "Content-Type": cover.contentType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
