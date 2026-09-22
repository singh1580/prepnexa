import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/session-cookie", () => ({ readSessionCookie: vi.fn() }));
vi.mock("@/features/auth/crypto", () => ({ hashIdentifier: (value: string) => value }));
vi.mock("@/features/auth/repository", () => ({ findActiveSession: vi.fn(), findAuthorizationForUser: vi.fn() }));
import { readSessionCookie } from "@/features/auth/session-cookie";
import { findActiveSession, findAuthorizationForUser } from "@/features/auth/repository";
import { requirePermissions } from "@/features/auth/authorization";

describe("combined admin action permissions", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requires a signed-in session before creating test questions", async () => {
    vi.mocked(readSessionCookie).mockResolvedValue(undefined);
    await expect(requirePermissions(["test.manage", "question.create"])).rejects.toMatchObject({ status: 401 });
    expect(findAuthorizationForUser).not.toHaveBeenCalled();
  });
  it.each([false, true])("requires every permission for paper publication (question permission: %s)", async granted => {
    vi.mocked(readSessionCookie).mockResolvedValue("test-session");
    vi.mocked(findActiveSession).mockResolvedValue({ userId: "fixture", userStatus: "ACTIVE" } as NonNullable<Awaited<ReturnType<typeof findActiveSession>>>);
    vi.mocked(findAuthorizationForUser).mockResolvedValue((granted ? ["test.manage", "question.publish"] : ["test.manage"]).map(permission => ({ role: "CONTENT_ADMIN", permission })));
    const result = requirePermissions(["test.manage", "question.publish"]);
    if (granted) await expect(result).resolves.toMatchObject({ permissions: ["test.manage", "question.publish"] });
    else await expect(result).rejects.toMatchObject({ status: 403 });
    expect(findActiveSession).toHaveBeenCalledOnce();
    expect(findAuthorizationForUser).toHaveBeenCalledOnce();
  });
});
