import { getCurrentAuth } from "@/features/auth/authorization";
import { submitContactInquiry } from "@/features/contact/service";
import { contactInquirySchema } from "@/features/contact/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || undefined;
}

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const [input, auth] = await Promise.all([
      request.json().then((body) => contactInquirySchema.parse(body)),
      getCurrentAuth(),
    ]);
    const result = await submitContactInquiry(input, { userId: auth?.user.id, ip: clientIp(request), requestId });
    return successResponse(result, requestId, { status: 201 });
  });
}

