import { logger } from "@/lib/logger";
import { contentConflict, isUniqueViolation } from "@/features/admin-content/errors";
import { findExam } from "@/features/admin-content/repository";
import { testNotFound, testStateConflict } from "./errors";
import { patchSection, replaceQuestionOrder, testHasPublishedPackage, archiveTestRecord, copyTestRecord, removeDraftItem, findManagedTest, findPublishedQuestionForExam, findSection, findTest, insertAssignment, insertSection, insertTest, listManagedTests, listTestExams, patchTest, publishTestRecord, type SectionInput, type TestInput } from "./repository";

type Actor = { userId: string; requestId: string };
async function write<T>(action: string, actor: Actor, operation: () => Promise<T>) { try { const result = await operation(); logger.info({ requestId: actor.requestId, module: "admin-tests", action, actorUserId: actor.userId }, "Admin test mutation completed"); return result; } catch (error) { if (isUniqueViolation(error)) throw contentConflict("This item already exists or uses the same display order."); throw error; } }
export const getTestExams = () => listTestExams();
export const getManagedTests = () => listManagedTests();
export async function getManagedTest(id: string) { const test = await findManagedTest(id); if (!test) throw testNotFound("Test"); return test; }
export async function createTest(input: TestInput, actor: Actor) { if (input.mode !== "MOCK") throw testStateConflict("Only mock tests are currently available."); if (!await findExam(input.examId)) throw testNotFound("Test"); return write("test_create", actor, () => insertTest(input, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function updateTest(id: string, input: TestInput, actor: Actor) { if (input.mode !== "MOCK") throw testStateConflict("Only mock tests are currently available."); const before = await findTest(id); if (!before) throw testNotFound("Test"); if (before.status !== "DRAFT") throw testStateConflict("Only draft tests can be edited."); if (!await findExam(input.examId)) throw testNotFound("Test"); if (before.examId !== input.examId) { const detail = await getManagedTest(id); if (detail.sections.some((section) => section.questions.length)) throw testStateConflict("Remove assigned questions before changing the exam."); } return write("test_update", actor, () => patchTest(before, input, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function createSection(testId: string, input: SectionInput, actor: Actor) { const test = await findTest(testId); if (!test) throw testNotFound("Test"); if (test.status !== "DRAFT") throw testStateConflict("Published tests cannot be restructured."); return write("test_section_create", actor, () => insertSection(testId, input, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function assignQuestion(sectionId: string, questionId: string, sortOrder: number, actor: Actor) { const section = await findSection(sectionId); if (!section) throw testNotFound("Section"); const test = await findTest(section.testId); if (!test) throw testNotFound("Test"); if (test.status !== "DRAFT") throw testStateConflict("Published tests cannot be restructured."); const question = await findPublishedQuestionForExam(questionId, test.examId); if (!question) throw testNotFound("Question"); return write("test_question_assign", actor, () => insertAssignment(test.id, sectionId, questionId, sortOrder, { actorUserId: actor.userId, requestId: actor.requestId })); }
export async function createSchedule(): Promise<never> { throw testStateConflict("Live tests are deferred. Create a mock test instead."); }
export async function publishTest(id: string, actor: Actor) { const before = await getManagedTest(id); if (before.mode !== "MOCK") throw testStateConflict("Only mock tests are currently available."); if (before.status !== "DRAFT") throw testStateConflict("Only draft tests can be published."); if (!before.sections.length || before.sections.some((section) => !section.questions.length)) throw testStateConflict("Add a question to every section before publishing."); if (before.sections.some(section => section.questions.some(question => question.status === "ARCHIVED"))) throw testStateConflict("Remove or replace archived questions before publishing."); const timed = before.sections.map((section) => section.durationMinutes); if (timed.some((minutes) => minutes !== null) && timed.reduce<number>((total, minutes) => total + (minutes ?? 0), 0) > before.durationMinutes) throw testStateConflict("Section durations cannot exceed the overall test duration."); return write("test_publish", actor, () => publishTestRecord(before, { actorUserId: actor.userId, requestId: actor.requestId })); }


export async function removeTestItem(sectionId: string, questionId: string | null, actor: Actor) {
  const removed = await removeDraftItem(sectionId, questionId, { actorUserId: actor.userId, requestId: actor.requestId });
  if (!removed) throw testStateConflict("Only existing items in draft mock tests can be removed. Remove a section's questions first.");
  return { removed: true };
}

export async function updateSection(id: string, input: SectionInput, actor: Actor) {
  const section = await findSection(id); if (!section) throw testNotFound("Section");
  const test = await findTest(section.testId);
  if (!test || test.status !== "DRAFT" || test.mode !== "MOCK") throw testStateConflict("Only draft mock sections can be edited.");
  return write("section_update", actor, () => patchSection(id, input, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function reorderQuestions(sectionId: string, questionIds: string[], actor: Actor) {
  const section = await findSection(sectionId); if (!section) throw testNotFound("Section");
  const test = await getManagedTest(section.testId);
  if (test.status !== "DRAFT" || test.mode !== "MOCK") throw testStateConflict("Only draft mock questions can be reordered.");
  const existing = test.sections.find(item => item.id === sectionId)!.questions.map(item => item.questionId);
  if (!questionIds.length || questionIds.length !== existing.length || new Set(questionIds).size !== existing.length || questionIds.some(id => !existing.includes(id))) throw testStateConflict("The questions changed. Refresh before reordering.");
  return write("questions_reorder", actor, () => replaceQuestionOrder(test.id, sectionId, questionIds, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function archiveTest(id: string, actor: Actor) {
  const test = await getManagedTest(id);
  if (test.status === "ARCHIVED") throw testStateConflict("This test is already archived.");
  if (await testHasPublishedPackage(id)) throw testStateConflict("Archive linked packages before archiving this test.");
  return write("test_archive", actor, () => archiveTestRecord(id, { actorUserId: actor.userId, requestId: actor.requestId }));
}
export async function duplicateTest(id: string, actor: Actor) {
  const test = await getManagedTest(id);
  if (test.mode !== "MOCK") throw testStateConflict("Only mock tests can be copied.");
  return write("test_copy", actor, () => copyTestRecord(test, { actorUserId: actor.userId, requestId: actor.requestId }));
}
