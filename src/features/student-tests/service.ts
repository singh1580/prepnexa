import { logger } from "@/lib/logger";
import { normalizeAnswerForQuestion, type AnswerInput } from "./validation";
import { attemptClosed, attemptConflict, attemptExpired, attemptNotFound, staleAnswer, studentTestNotFound, testAccessRequired } from "./errors";
import { createAttemptWithSnapshots, expireStudentAttempts, findActiveAttempt, findAnswerTarget, findAttemptForStudent, findAttemptOwnerStatus, findStartContext, findStudentTestAccess, listStudentTests, randomUUID, saveAnswerRecord, stableOrder, submitAttemptRecord, type AttemptSnapshotInput } from "./repository";

type Actor = { userId: string; requestId: string };

function databaseCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return typeof candidate.code === "string" ? candidate.code : typeof candidate.cause?.code === "string" ? candidate.cause.code : undefined;
}

export async function getStudentTests(userId: string) {
  await expireStudentAttempts(userId);
  return listStudentTests(userId);
}

export async function getStudentTest(testId: string, userId: string) {
  await expireStudentAttempts(userId);
  const test = await findStudentTestAccess(testId, userId);
  if (!test) throw studentTestNotFound();
  return test;
}

export async function startOrResumeAttempt(testId: string, actor: Actor) {
  await expireStudentAttempts(actor.userId);
  const active = await findActiveAttempt(actor.userId);
  if (active?.testId === testId) return { id: active.id, resumed: true };
  if (active) throw attemptConflict("Finish or submit your active test before starting another one.");
  const context = await findStartContext(testId, actor.userId);
  if (!context) throw studentTestNotFound();
  if (!context.hasAccess) throw testAccessRequired();
  if (context.attemptsUsed >= context.maxAttempts) throw attemptConflict("You have used all attempts available for this test.");
  if (!context.sections.length || !context.questions.length || context.questions.length !== context.questionCount) throw attemptConflict("This test is not ready to start. Contact the administrator.");

  const attemptId = randomUUID();
  const snapshots: AttemptSnapshotInput[] = [];
  for (const section of context.sections) {
    const questions = context.questions.filter(question => question.sectionId === section.id);
    if (context.shuffleQuestions) questions.sort((a, b) => stableOrder(attemptId, a.questionId).localeCompare(stableOrder(attemptId, b.questionId)));
    else questions.sort((a, b) => a.questionOrder - b.questionOrder);
    for (const question of questions) {
      const options = [...question.options];
      if (context.shuffleOptions) options.sort((a, b) => stableOrder(attemptId, a.id).localeCompare(stableOrder(attemptId, b.id)));
      snapshots.push({ id: randomUUID(), questionId: question.questionId, revisionId: question.revisionId, sectionId: question.sectionId,
        topicId: question.topicId, type: question.type, position: snapshots.length, stem: question.stem, explanation: question.explanation,
        marks: question.marks, negativeMarks: question.negativeMarks, answerConfig: question.answerConfig,
        options: options.map((option, position) => ({ id: randomUUID(), stableKey: option.stableKey, body: option.body, isCorrect: option.isCorrect, position })) });
    }
  }
  const deadline = new Date(Date.now() + context.durationMinutes * 60_000);
  try {
    const created = await createAttemptWithSnapshots({ attemptId, userId: actor.userId, testId, sequence: context.attemptsUsed + 1, deadline, sections: context.sections, snapshots, requestId: actor.requestId });
    if (!created) throw attemptConflict("The test could not be started. Please try again.");
    logger.info({ requestId: actor.requestId, module: "student-tests", action: "attempt_start", actorUserId: actor.userId, attemptId }, "Student attempt started");
    return { id: attemptId, resumed: false };
  } catch (error) {
    if (databaseCode(error) === "23505") {
      const concurrent = await findActiveAttempt(actor.userId);
      if (concurrent?.testId === testId) return { id: concurrent.id, resumed: true };
      throw attemptConflict("Another test attempt is already active for this account.");
    }
    throw error;
  }
}

export async function getAttempt(attemptId: string, userId: string) {
  const attempt = await findAttemptForStudent(attemptId, userId);
  if (!attempt) throw attemptNotFound();
  return { ...attempt,
    startedAt: attempt.startedAt?.toISOString() ?? null,
    serverDeadlineAt: attempt.serverDeadlineAt?.toISOString() ?? null,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    serverTime: attempt.serverTime.toISOString(),
    remainingSeconds: attempt.serverDeadlineAt ? Math.max(0, Math.ceil((attempt.serverDeadlineAt.getTime() - attempt.serverTime.getTime()) / 1000)) : 0,
    questions: attempt.questions.map(question => ({ ...question, answer: { ...question.answer, savedAt: question.answer.savedAt ? new Date(question.answer.savedAt).toISOString() : null } })),
  };
}

export async function findAttempt(attemptId: string, userId: string) {
  const attempt = await findAttemptForStudent(attemptId, userId);
  if (!attempt) return null;
  return { ...attempt,
    startedAt: attempt.startedAt?.toISOString() ?? null,
    serverDeadlineAt: attempt.serverDeadlineAt?.toISOString() ?? null,
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    serverTime: attempt.serverTime.toISOString(),
    remainingSeconds: attempt.serverDeadlineAt ? Math.max(0, Math.ceil((attempt.serverDeadlineAt.getTime() - attempt.serverTime.getTime()) / 1000)) : 0,
    questions: attempt.questions.map(question => ({ ...question, answer: { ...question.answer, savedAt: question.answer.savedAt ? new Date(question.answer.savedAt).toISOString() : null } })),
  };
}

export async function saveAttemptAnswer(attemptId: string, snapshotId: string, input: AnswerInput, actor: Actor) {
  const target = await findAnswerTarget(attemptId, snapshotId, actor.userId);
  if (!target) throw attemptNotFound();
  if (target.status !== "IN_PROGRESS") throw attemptClosed();
  if (new Date(target.serverDeadlineAt) <= new Date()) {
    await submitAttemptRecord(attemptId, actor.userId, actor.requestId);
    throw attemptExpired();
  }
  if (target.version !== input.version) throw staleAnswer();
  const answer = normalizeAnswerForQuestion(target.type, input, target.optionIds);
  const saved = await saveAnswerRecord({ attemptId, snapshotId, userId: actor.userId, questionId: target.questionId, ...answer, markedForReview: input.markedForReview, version: input.version });
  if (!saved) throw staleAnswer();
  return { version: saved.version, savedAt: new Date(saved.savedAt).toISOString() };
}

export async function submitAttempt(attemptId: string, actor: Actor) {
  const submitted = await submitAttemptRecord(attemptId, actor.userId, actor.requestId);
  if (submitted) {
    logger.info({ requestId: actor.requestId, module: "student-tests", action: "attempt_submit", actorUserId: actor.userId, attemptId, status: submitted.status }, "Student attempt submitted");
    return { ...submitted, submittedAt: new Date(submitted.submittedAt).toISOString() };
  }
  const existing = await findAttemptOwnerStatus(attemptId, actor.userId);
  if (!existing) throw attemptNotFound();
  if (existing.status === "SUBMITTED" || existing.status === "AUTO_SUBMITTED" || existing.status === "EVALUATED") return { id: existing.id, status: existing.status, submittedAt: existing.submittedAt?.toISOString() ?? null };
  throw attemptClosed();
}
