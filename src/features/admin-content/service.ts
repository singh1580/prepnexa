import { logger } from "@/lib/logger";
import { contentConflict, contentNotFound, isUniqueViolation } from "./errors";
import { findExam, findExamTree, findSubject, findTopic, insertExam, insertSubject, insertTopic, listExams, patchExam, patchSubject, patchTopic } from "./repository";

type Actor = { userId: string; requestId: string };
type ExamInput = { name: string; slug: string; description: string };
type TaxonomyInput = { name: string; sortOrder: number };

export const getManagedExams = () => listExams();
export async function getManagedExam(id: string) {
  const exam = await findExamTree(id);
  if (!exam) throw contentNotFound("Exam");
  return exam;
}

async function write<T>(action: string, actor: Actor, operation: () => Promise<T>, conflictMessage: string) {
  try {
    const result = await operation();
    logger.info({ requestId: actor.requestId, module: "admin-content", action, actorUserId: actor.userId }, "Admin content mutation completed");
    return result;
  } catch (error) {
    if (isUniqueViolation(error)) throw contentConflict(conflictMessage);
    throw error;
  }
}

export function createExam(input: ExamInput, actor: Actor) {
  return write("exam_create", actor, () => insertExam(input, { actorUserId: actor.userId, requestId: actor.requestId }), "An exam with this slug already exists.");
}
export async function updateExam(id: string, input: ExamInput, actor: Actor) {
  const before = await findExam(id);
  if (!before) throw contentNotFound("Exam");
  await write("exam_update", actor, () => patchExam(before, input, { actorUserId: actor.userId, requestId: actor.requestId }), "An exam with this slug already exists.");
  return { id };
}
export async function createSubject(examId: string, input: TaxonomyInput, actor: Actor) {
  if (!await findExam(examId)) throw contentNotFound("Exam");
  return write("subject_create", actor, () => insertSubject(examId, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This exam already has a subject with that name.");
}
export async function updateSubject(id: string, input: TaxonomyInput, actor: Actor) {
  const before = await findSubject(id);
  if (!before) throw contentNotFound("Subject");
  await write("subject_update", actor, () => patchSubject(before, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This exam already has a subject with that name.");
  return { id };
}
export async function createTopic(subjectId: string, input: TaxonomyInput, actor: Actor) {
  if (!await findSubject(subjectId)) throw contentNotFound("Subject");
  return write("topic_create", actor, () => insertTopic(subjectId, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This subject already has a topic with that name.");
}
export async function updateTopic(id: string, input: TaxonomyInput, actor: Actor) {
  const before = await findTopic(id);
  if (!before) throw contentNotFound("Topic");
  await write("topic_update", actor, () => patchTopic(before, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This subject already has a topic with that name.");
  return { id };
}
