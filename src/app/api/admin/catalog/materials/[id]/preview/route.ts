import { requirePermission } from "@/features/auth/authorization";
import { getAdminMaterialFile } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { executeRoute } from "@/lib/http/route-handler";

function safeFileName(value: string) {
  return value.replace(/[\r\n"\\/]/g, "_").slice(0, 180);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async () => {
    await requirePermission("material.manage");
    const file = await getAdminMaterialFile(catalogIdSchema.parse((await params).id));
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${safeFileName(file.fileName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
