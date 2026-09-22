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
    const token = await createStudentMaterialLink(id, action, auth.user.id);
    const suffix = action === "DOWNLOAD" ? "&download=1" : "";
    return Response.redirect(new URL(`/api/materials/${id}/content?token=${encodeURIComponent(token)}${suffix}`, request.url), 303);
  });
}
