import { z } from "zod";
import { requireStudent } from "@/features/auth/authorization";
import { createStudentMaterialLink } from "@/features/materials/service";
import { executeRoute } from "@/lib/http/route-handler";

const idSchema = z.uuid();
const actionSchema = z.enum(["view", "download"]);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async () => {
    const auth = await requireStudent();
    const id = idSchema.parse((await params).id);
    const action = actionSchema.parse(new URL(request.url).searchParams.get("action") ?? "view").toUpperCase() as "VIEW" | "DOWNLOAD";
    const courseSlug = new URL(request.url).searchParams.get("course") ?? undefined;
    const token = await createStudentMaterialLink(id, action, auth.user.id, courseSlug);
    const suffix = action === "DOWNLOAD" ? "&download=1" : "";
    const location = `/api/materials/${id}/content?token=${encodeURIComponent(token)}${suffix}`;
    return new Response(null, {
      status: 303,
      headers: {
        // Keep the redirect on the browser's current origin. Building an
        // absolute URL from request.url leaks an EC2 reverse proxy's internal
        // localhost host into the public Location header.
        Location: location,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  });
}
