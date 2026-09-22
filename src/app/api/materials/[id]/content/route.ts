import { z } from "zod";
import { requireStudent } from "@/features/auth/authorization";
import { hashIdentifier } from "@/features/auth/crypto";
import { deliverStudentMaterial } from "@/features/materials/service";
import { invalidMaterialLink } from "@/features/materials/errors";
import { executeRoute } from "@/lib/http/route-handler";

const idSchema = z.uuid();
const tokenSchema = z.string().min(40).max(2_000);

function safeFileName(value: string | null, fallback: string) {
  return (value ?? fallback).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-180);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requireStudent();
    const id = idSchema.parse((await params).id);
    const token = tokenSchema.parse(new URL(request.url).searchParams.get("token"));
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await deliverStudentMaterial(token, auth.user, { requestId, ipHash: forwarded ? hashIdentifier(forwarded) : undefined });
    if (result.material.id !== id) throw invalidMaterialLink();
    const download = new URL(request.url).searchParams.get("download") === "1";
    const disposition = result.material.allowDownload && download ? "attachment" : "inline";
    const fileName = safeFileName(result.material.originalFileName, `${result.material.title}.pdf`);
    return new Response(Buffer.from(result.bytes), { headers: {
      "Content-Type": result.material.contentType ?? "application/octet-stream",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  });
}
