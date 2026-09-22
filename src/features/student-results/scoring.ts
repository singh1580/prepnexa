export type ScoringQuestion = {
  questionId: string; sectionId: string; topicId: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT";
  marks: string; negativeMarks: string; answerConfig: Record<string, unknown>;
  options: { id: string; isCorrect: boolean }[];
  selectedOptionIds: string[]; textAnswer: string | null; numericAnswer: string | null;
};

export type ScoredQuestion = ScoringQuestion & { answered: boolean; correct: boolean; awardedMarks: string; maxMarks: string };

function hundredths(value: string | number) { return Math.round(Number(value) * 100); }
function decimal(value: number) { return (value / 100).toFixed(2); }
function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every(id => expected.has(id));
}

export function scoreQuestion(question: ScoringQuestion): ScoredQuestion {
  let answered = false, correct = false;
  if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") {
    answered = question.selectedOptionIds.length > 0;
    correct = answered && sameIds(question.selectedOptionIds, question.options.filter(option => option.isCorrect).map(option => option.id));
  } else if (question.type === "NUMERIC") {
    answered = question.numericAnswer !== null && question.numericAnswer.trim() !== "";
    const expected = Number(question.answerConfig.value), actual = Number(question.numericAnswer), tolerance = Number(question.answerConfig.tolerance ?? 0);
    correct = answered && Number.isFinite(expected) && Number.isFinite(actual) && Number.isFinite(tolerance) && Math.abs(actual - expected) <= tolerance;
  } else {
    const actual = question.textAnswer?.trim() ?? "";
    answered = actual.length > 0;
    const caseSensitive = question.answerConfig.caseSensitive === true;
    const normalized = caseSensitive ? actual : actual.toLocaleLowerCase("en");
    const accepted = Array.isArray(question.answerConfig.acceptedAnswers) ? question.answerConfig.acceptedAnswers.filter((item): item is string => typeof item === "string").map(item => caseSensitive ? item.trim() : item.trim().toLocaleLowerCase("en")) : [];
    correct = answered && accepted.includes(normalized);
  }
  const awarded = correct ? hundredths(question.marks) : answered ? -hundredths(question.negativeMarks) : 0;
  return { ...question, answered, correct, awardedMarks: decimal(awarded), maxMarks: decimal(hundredths(question.marks)) };
}

function group<T extends { awardedMarks: string; maxMarks: string; answered: boolean; correct: boolean }>(items: T[]) {
  const score = items.reduce((total, item) => total + hundredths(item.awardedMarks), 0);
  const maxScore = items.reduce((total, item) => total + hundredths(item.maxMarks), 0);
  return { score: decimal(score), maxScore: decimal(maxScore), correctCount: items.filter(item => item.correct).length,
    incorrectCount: items.filter(item => item.answered && !item.correct).length, unansweredCount: items.filter(item => !item.answered).length,
    attemptedCount: items.filter(item => item.answered).length };
}

export function scoreAttempt(questions: ScoringQuestion[]) {
  const scored = questions.map(scoreQuestion);
  const total = group(scored);
  const sections = [...new Set(scored.map(item => item.sectionId))].map(sectionId => ({ sectionId, ...group(scored.filter(item => item.sectionId === sectionId)) }));
  const topics = [...new Set(scored.map(item => item.topicId))].map(topicId => ({ topicId, ...group(scored.filter(item => item.topicId === topicId)) }));
  return { questions: scored, sections, topics, ...total };
}
