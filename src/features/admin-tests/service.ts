import { logger } from "@/lib/logger";
import {
  contentConflict,
  isUniqueViolation,
} from "@/features/admin-content/errors";
import { testNotFound, testStateConflict } from "./errors";
import {
  patchSection,
  replaceQuestionOrder,
  copyTestRecord,
  deleteTestRecord,
  removeTestContent,
  findManagedTest,
  findAvailableQuestion,
  findSection,
  findTest,
  insertAssignment,
  insertSection,
  insertTest,
  listManagedTests,
  patchTest,
  type ManagedTestFilters,
  type SectionInput,
  type TestInput,
} from "./repository";

type Actor = { userId: string; requestId: string };
async function write<T>(
  action: string,
  actor: Actor,
  operation: () => Promise<T>,
) {
  try {
    const result = await operation();
    logger.info(
      {
        requestId: actor.requestId,
        module: "admin-tests",
        action,
        actorUserId: actor.userId,
      },
      "Admin test mutation completed",
    );
    return result;
  } catch (error) {
    if (isUniqueViolation(error))
      throw contentConflict(
        "This item already exists or uses the same display order.",
      );
    throw error;
  }
}
export const getManagedTests = (filters: ManagedTestFilters) =>
  listManagedTests(filters);
export async function getManagedTest(id: string) {
  const test = await findManagedTest(id);
  if (!test) throw testNotFound("Test");
  return test;
}
export async function createTest(input: TestInput&{sections:string[]}, actor: Actor) {
  return write("test_create", actor, () =>
    insertTest(input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function updateTest(id: string, input: TestInput, actor: Actor) {
  const before = await findTest(id);
  if (!before) throw testNotFound("Test");
  return write("test_update", actor, () =>
    patchTest(before, input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function createSection(
  testId: string,
  input: SectionInput,
  actor: Actor,
) {
  const test = await findTest(testId);
  if (!test) throw testNotFound("Test");
  return write("test_section_create", actor, () =>
    insertSection(testId, input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function assignQuestion(
  sectionId: string,
  questionId: string,
  sortOrder: number,
  actor: Actor,
) {
  const section = await findSection(sectionId);
  if (!section) throw testNotFound("Section");
  const test = await findTest(section.testId);
  if (!test) throw testNotFound("Test");
  const question = await findAvailableQuestion(questionId);
  if (!question) throw testNotFound("Question");
  return write("test_question_assign", actor, () =>
    insertAssignment(test.id, sectionId, questionId, sortOrder, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function createSchedule(): Promise<never> {
  throw testStateConflict(
    "Live tests are deferred. Create a mock test instead.",
  );
}
export async function removeTestItem(
  sectionId: string,
  questionId: string | null,
  actor: Actor,
) {
  const removed = await removeTestContent(sectionId, questionId, {
    actorUserId: actor.userId,
    requestId: actor.requestId,
  });
  if (!removed)
    throw testStateConflict(
      "The item could not be removed. Remove a section's questions first.",
    );
  return { removed: true };
}

export async function updateSection(
  id: string,
  input: SectionInput,
  actor: Actor,
) {
  const section = await findSection(id);
  if (!section) throw testNotFound("Section");
  const test = await findTest(section.testId);
  if (!test)
    throw testStateConflict("This test is unavailable.");
  return write("section_update", actor, () =>
    patchSection(id, input, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function reorderQuestions(
  sectionId: string,
  questionIds: string[],
  actor: Actor,
) {
  const section = await findSection(sectionId);
  if (!section) throw testNotFound("Section");
  const test = await getManagedTest(section.testId);
  const existing = test.sections
    .find((item) => item.id === sectionId)!
    .questions.map((item) => item.questionId);
  if (
    !questionIds.length ||
    questionIds.length !== existing.length ||
    new Set(questionIds).size !== existing.length ||
    questionIds.some((id) => !existing.includes(id))
  )
    throw testStateConflict(
      "The questions changed. Refresh before reordering.",
    );
  return write("questions_reorder", actor, () =>
    replaceQuestionOrder(test.id, sectionId, questionIds, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function duplicateTest(id: string, actor: Actor) {
  const test = await getManagedTest(id);
  return write("test_copy", actor, () =>
    copyTestRecord(test, {
      actorUserId: actor.userId,
      requestId: actor.requestId,
    }),
  );
}
export async function deleteTest(id: string, actor: Actor) {
  const test = await findTest(id);
  if (!test) throw testNotFound("Test");
  const removed = await write("test_delete", actor, () => deleteTestRecord(id, { actorUserId: actor.userId, requestId: actor.requestId }));
  if (!removed) throw testStateConflict("Remove this test from every product package first. Tests with student attempts must be retained.");
  return removed;
}
