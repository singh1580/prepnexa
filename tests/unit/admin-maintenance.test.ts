import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));
vi.mock("../../src/features/admin-catalog/repository", () => ({
  findProduct: vi.fn(), findMaterial: vi.fn(), materialHasPublishedPackage: vi.fn(),
  archiveCatalogRecord: vi.fn(), patchProduct: vi.fn(), unlinkProductRecord: vi.fn(),
}));
vi.mock("../../src/features/admin-content/repository", () => ({ findExam: vi.fn() }));
vi.mock("../../src/features/admin-tests/repository", () => ({
  findManagedTest: vi.fn(), findSection: vi.fn(), replaceQuestionOrder: vi.fn(),
  testHasPublishedPackage: vi.fn(), archiveTestRecord: vi.fn(), publishTestRecord: vi.fn(),
}));
import * as catalogRepo from "../../src/features/admin-catalog/repository";
import * as testRepo from "../../src/features/admin-tests/repository";
import { archiveCatalog, updateProduct, unlinkProduct } from "../../src/features/admin-catalog/service";
import { archiveTest, publishTest, reorderQuestions } from "../../src/features/admin-tests/service";

const actor = { userId: "owner", requestId: "request" };
describe("admin maintenance safeguards", () => {
  beforeEach(() => vi.clearAllMocks());
  it("does not edit or unlink a published package", async () => {
    vi.mocked(catalogRepo.findProduct).mockResolvedValue({ id: "package", status: "PUBLISHED" } as NonNullable<Awaited<ReturnType<typeof catalogRepo.findProduct>>>);
    await expect(updateProduct("package", { name: "New", slug: "new", description: "", pricePaise: 100, accessDays: 90 }, actor)).rejects.toMatchObject({ status: 409 });
    await expect(unlinkProduct("package", "TEST", "test", actor)).rejects.toMatchObject({ status: 409 });
    expect(catalogRepo.patchProduct).not.toHaveBeenCalled();
    expect(catalogRepo.unlinkProductRecord).not.toHaveBeenCalled();
  });
  it("preserves material used by a published package", async () => {
    vi.mocked(catalogRepo.findMaterial).mockResolvedValue({ id: "material", status: "PUBLISHED" } as NonNullable<Awaited<ReturnType<typeof catalogRepo.findMaterial>>>);
    vi.mocked(catalogRepo.materialHasPublishedPackage).mockResolvedValue(true);
    await expect(archiveCatalog("material", "material", actor)).rejects.toMatchObject({ status: 409 });
    expect(catalogRepo.archiveCatalogRecord).not.toHaveBeenCalled();
  });
  it("preserves tests used by a published package", async () => {
    vi.mocked(testRepo.findManagedTest).mockResolvedValue({ id: "test", status: "PUBLISHED" } as NonNullable<Awaited<ReturnType<typeof testRepo.findManagedTest>>>);
    vi.mocked(testRepo.testHasPublishedPackage).mockResolvedValue(true);
    await expect(archiveTest("test", actor)).rejects.toMatchObject({ status: 409 });
    expect(testRepo.archiveTestRecord).not.toHaveBeenCalled();
  });
  it("rejects stale or foreign question IDs during reordering", async () => {
    vi.mocked(testRepo.findSection).mockResolvedValue({ id: "section", testId: "test" } as NonNullable<Awaited<ReturnType<typeof testRepo.findSection>>>);
    vi.mocked(testRepo.findManagedTest).mockResolvedValue({ id: "test", mode: "MOCK", status: "DRAFT", sections: [{ id: "section", questions: [{ questionId: "q1" }, { questionId: "q2" }] }] } as NonNullable<Awaited<ReturnType<typeof testRepo.findManagedTest>>>);
    for (const ids of [["q1"], ["q1", "q1"], ["q1", "foreign"]]) await expect(reorderQuestions("section", ids, actor)).rejects.toMatchObject({ status: 409 });
    expect(testRepo.replaceQuestionOrder).not.toHaveBeenCalled();
    await reorderQuestions("section", ["q2", "q1"], actor);
    expect(testRepo.replaceQuestionOrder).toHaveBeenCalledWith("test", "section", ["q2", "q1"], expect.any(Object));
  });
  it("does not publish a copied paper containing an unavailable question", async () => {
    vi.mocked(testRepo.findManagedTest).mockResolvedValue({ id: "test", mode: "MOCK", status: "DRAFT", sections: [{ id: "section", questions: [{ questionId: "archived-question" }] }], availableQuestions: [] } as unknown as NonNullable<Awaited<ReturnType<typeof testRepo.findManagedTest>>>);
    await expect(publishTest("test", actor)).rejects.toMatchObject({ status: 409 });
    expect(testRepo.publishTestRecord).not.toHaveBeenCalled();
  });
});
