import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/features/admin-content/repository", () => ({
  findQuestion: vi.fn(),
  setQuestionReviewState: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));
import { findQuestion, setQuestionReviewState } from "../../src/features/admin-content/repository";
import { publishQuestion, submitQuestion, reviewQuestion } from "../../src/features/admin-content/service";

const actor = { userId: "owner", requestId: "request" };
describe("single-admin publishing", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(["DRAFT", "IN_REVIEW"] as const)("publishes own %s question without a reviewer", async (status) => {
    vi.mocked(findQuestion).mockResolvedValue({ id: "question", status, createdBy: actor.userId, reviewedBy: null } as NonNullable<Awaited<ReturnType<typeof findQuestion>>>);
    vi.mocked(setQuestionReviewState).mockResolvedValue({ id: "question", status: "PUBLISHED" });
    await expect(publishQuestion("question", actor)).resolves.toEqual({ id: "question", status: "PUBLISHED" });
    expect(setQuestionReviewState).toHaveBeenCalledWith(expect.objectContaining({ reviewedBy: null }), "PUBLISH", { actorUserId: "owner", requestId: "request" });
  });
  it.each(["PUBLISHED", "ARCHIVED"] as const)("rejects publishing %s content", async (status) => {
    vi.mocked(findQuestion).mockResolvedValue({ id: "question", status } as NonNullable<Awaited<ReturnType<typeof findQuestion>>>);
    await expect(publishQuestion("question", actor)).rejects.toMatchObject({ code: "INVALID_CONTENT_STATE" });
    expect(setQuestionReviewState).not.toHaveBeenCalled();
  });
  it("rejects missing content", async () => {
    vi.mocked(findQuestion).mockResolvedValue(undefined);
    await expect(publishQuestion("missing", actor)).rejects.toMatchObject({ status: 404 });
  });
  it("retires approval endpoints", async () => {
    await expect(submitQuestion()).rejects.toMatchObject({ status: 410 });
    await expect(reviewQuestion()).rejects.toMatchObject({ status: 410 });
  });
});
