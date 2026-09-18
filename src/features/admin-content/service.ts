import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors/app-error";
import { contentConflict, contentNotFound, invalidContentState, isUniqueViolation } from "./errors";
import { findExam, findExamTree, findQuestion, findSubject, findTopic, insertExam, insertQuestion, insertSubject, insertTopic, listExams, listQuestions, listQuestionTopics, patchExam, patchQuestion, patchSubject, patchTopic, setQuestionReviewState, type QuestionInput } from "./repository";

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

export const getQuestionTopics = () => listQuestionTopics();
export const getManagedQuestions = () => listQuestions();
export async function getManagedQuestion(id: string) {
  const question = await findQuestion(id);
  if (!question) throw contentNotFound("Question");
  return question;
}

export async function createQuestion(input: QuestionInput, actor: Actor) {
  if (!await findTopic(input.topicId)) throw contentNotFound("Topic");
  return write("question_create", actor, () => insertQuestion(input, { actorUserId: actor.userId, requestId: actor.requestId }), "This question conflicts with existing content.");
}

export async function updateQuestion(id: string, input: QuestionInput, actor: Actor) {
  const before = await getManagedQuestion(id);
  if (before.status !== "DRAFT") throw invalidContentState("Only draft questions can be edited.");
  if (!await findTopic(input.topicId)) throw contentNotFound("Topic");
  return write("question_update", actor, () => patchQuestion(before, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This question was updated elsewhere. Refresh and try again.");
}

export async function submitQuestion(id: string, actor: Actor) {
  const before = await getManagedQuestion(id);
  if (before.status !== "DRAFT") throw invalidContentState("Only draft questions can be submitted for review.");
  return write("question_submit", actor, () => setQuestionReviewState(before, "SUBMIT", { actorUserId: actor.userId, requestId: actor.requestId }), "The question state changed. Refresh and try again.");
}

export async function reviewQuestion(id: string, action: "APPROVE" | "RETURN", actor: Actor) {
  const before = await getManagedQuestion(id);
  if (before.status !== "IN_REVIEW") throw invalidContentState("Only questions in review can be reviewed.");
  if (before.createdBy === actor.userId) throw new AppError("REVIEWER_SEPARATION_REQUIRED", "A question must be reviewed by someone other than its creator.", 403);
  if (action === "APPROVE" && before.reviewedBy) throw invalidContentState("This question is already approved and ready to publish.");
  return write(`question_${action.toLowerCase()}`, actor, () => setQuestionReviewState(before, action, { actorUserId: actor.userId, requestId: actor.requestId }), "The question state changed. Refresh and try again.");
}

export async function publishQuestion(id: string, actor: Actor) {
  const before = await getManagedQuestion(id);
  if (before.status !== "IN_REVIEW" || !before.reviewedBy) throw invalidContentState("A separate reviewer must approve this question before publishing.");
  return write("question_publish", actor, () => setQuestionReviewState(before, "PUBLISH", { actorUserId: actor.userId, requestId: actor.requestId }), "The question state changed. Refresh and try again.");
}

export async function archiveQuestion(id: string, actor: Actor) {
  const before = await getManagedQuestion(id);
  if (before.status !== "PUBLISHED") throw invalidContentState("Only published questions can be archived.");
  return write("question_archive", actor, () => setQuestionReviewState(before, "ARCHIVE", { actorUserId: actor.userId, requestId: actor.requestId }), "The question state changed. Refresh and try again.");
}
