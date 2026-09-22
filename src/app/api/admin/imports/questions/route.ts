import { z } from "zod";
import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { importQuestionsCsv } from "@/features/admin-imports/service";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

const inputSchema = z.object({ csv: z.string().min(1).max(1_000_000) }).strict();
export async function POST(request: Request) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.createQuestions); const result = await importQuestionsCsv(inputSchema.parse(await request.json()).csv, { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
