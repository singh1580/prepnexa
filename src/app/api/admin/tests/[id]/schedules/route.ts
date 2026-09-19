import { requirePermission } from "@/features/auth/authorization";
import { createSchedule } from "@/features/admin-tests/service";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) {
  return executeRoute(request, async () => {
    await requirePermission("test.manage");
    return createSchedule();
  });
}
