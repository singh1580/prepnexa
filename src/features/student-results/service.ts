import { logger } from "@/lib/logger";
import { findAttemptForScoring, findPendingStudentAttempts, findResultIdByAttempt, findStudentResult, listStudentResults, persistInitialResult } from "./repository";
import { resultNotFound, resultNotReady } from "./errors";
import { scoreAttempt } from "./scoring";

export async function evaluateAttempt(attemptId: string, userId: string, requestId: string) {
  const existing = await findResultIdByAttempt(attemptId, userId);
  if (existing) return existing;
  const attempt = await findAttemptForScoring(attemptId, userId);
  if (!attempt) throw resultNotFound();
  if (!attempt.submittedAt || !["SUBMITTED", "AUTO_SUBMITTED", "EVALUATED"].includes(attempt.status)) throw resultNotReady();
  const scoring = scoreAttempt(attempt.questions);
  const elapsed = attempt.startedAt ? Math.max(0, Math.floor((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)) : 0;
  const seconds = Math.min(elapsed, attempt.durationMinutes * 60);
  const created = await persistInitialResult({ attemptId, userId, requestId, timeSpentSeconds: seconds, score: scoring.score, maxScore: scoring.maxScore,
    correctCount: scoring.correctCount, incorrectCount: scoring.incorrectCount, unansweredCount: scoring.unansweredCount,
    questions: scoring.questions.map(item => ({ questionId: item.questionId, correct: item.correct, awardedMarks: item.awardedMarks })),
    sections: scoring.sections, topics: scoring.topics });
  const id = created?.id ?? (await findResultIdByAttempt(attemptId, userId))?.id;
  if (!id) throw resultNotReady();
  logger.info({ requestId, module: "student-results", action: "result_publish", actorUserId: userId, attemptId, resultId: id }, "Student result published");
  return { id };
}

async function evaluatePending(userId: string) {
  const pending = await findPendingStudentAttempts(userId);
  await Promise.all(pending.map(attempt => evaluateAttempt(attempt.id, userId, crypto.randomUUID())));
}

export async function getStudentResults(userId: string) { await evaluatePending(userId); return listStudentResults(userId); }
export async function getStudentResult(resultId: string, userId: string) { const result = await findStudentResult(resultId, userId); if (!result) throw resultNotFound(); return result; }
