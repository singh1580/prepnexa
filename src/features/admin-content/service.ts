import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors/app-error";
import { contentConflict, contentNotFound, invalidContentState, isUniqueViolation } from "./errors";
import { examHasPublishedDependencies, findExam, findExamTree, findQuestion, findSubject, findTopic, insertExam, insertQuestion, insertSubject, insertTopic, listExams, listQuestions, listQuestionTopics, patchExam, patchQuestion, patchSubject, patchTopic, questionHasPublishedTest, setExamStatus, setQuestionReviewState, type QuestionInput } from "./repository";

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
  if (before.status !== "DRAFT") throw invalidContentState("Only draft exams can be edited.");
  await write("exam_update", actor, () => patchExam(before, input, { actorUserId: actor.userId, requestId: actor.requestId }), "An exam with this slug already exists.");
  return { id };
}
export async function publishExam(id: string, actor: Actor) { const before = await getManagedExam(id); if (before.status !== "DRAFT") throw invalidContentState("Only draft exams can be published."); if (!before.subjects.length || !before.subjects.some((subject) => subject.topics.length)) throw invalidContentState("Add at least one subject and topic before publishing."); return write("exam_publish", actor, () => setExamStatus(before, "PUBLISHED", { actorUserId: actor.userId, requestId: actor.requestId }), "The exam state changed. Refresh and try again."); }
export async function archiveExam(id: string, actor: Actor) { const before = await getManagedExam(id); if (before.status !== "PUBLISHED") throw invalidContentState("Only published exams can be archived."); if (await examHasPublishedDependencies(id)) throw invalidContentState("Archive or replace published tests and materials before archiving this exam."); return write("exam_archive", actor, () => setExamStatus(before, "ARCHIVED", { actorUserId: actor.userId, requestId: actor.requestId }), "The exam state changed. Refresh and try again."); }
export async function createSubject(examId: string, input: TaxonomyInput, actor: Actor) {
  const exam = await findExam(examId); if (!exam) throw contentNotFound("Exam"); if (exam.status !== "DRAFT") throw invalidContentState("Only draft exams can be restructured.");
  return write("subject_create", actor, () => insertSubject(examId, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This exam already has a subject with that name.");
}
export async function updateSubject(id: string, input: TaxonomyInput, actor: Actor) {
  const before = await findSubject(id);
  if (!before) throw contentNotFound("Subject");
  const exam = await findExam(before.examId); if (!exam) throw contentNotFound("Exam"); if (exam.status !== "DRAFT") throw invalidContentState("Only draft exams can be restructured.");
  await write("subject_update", actor, () => patchSubject(before, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This exam already has a subject with that name.");
  return { id };
}
export async function createTopic(subjectId: string, input: TaxonomyInput, actor: Actor) {
  const subject = await findSubject(subjectId); if (!subject) throw contentNotFound("Subject"); const exam = await findExam(subject.examId); if (!exam) throw contentNotFound("Exam"); if (exam.status !== "DRAFT") throw invalidContentState("Only draft exams can be restructured.");
  return write("topic_create", actor, () => insertTopic(subjectId, input, { actorUserId: actor.userId, requestId: actor.requestId }), "This subject already has a topic with that name.");
}
export async function updateTopic(id: string, input: TaxonomyInput, actor: Actor) {
  const before = await findTopic(id);
  if (!before) throw contentNotFound("Topic");
  const subject = await findSubject(before.subjectId); if (!subject) throw contentNotFound("Subject"); const exam = await findExam(subject.examId); if (!exam) throw contentNotFound("Exam"); if (exam.status !== "DRAFT") throw invalidContentState("Only draft exams can be restructured.");
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
  if (await questionHasPublishedTest(id)) throw invalidContentState("This question belongs to a published test and cannot be archived.");
  return write("question_archive", actor, () => setQuestionReviewState(before, "ARCHIVE", { actorUserId: actor.userId, requestId: actor.requestId }), "The question state changed. Refresh and try again.");
}
