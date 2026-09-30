import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { questionOptions, questionRevisions, questions } from "@/db/schema";

export type QuestionInput = {
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT";
  stem: string;
  imageUrl?: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: { stableKey: string; body: string; isCorrect: boolean; sortOrder: number }[];
  numericAnswer: number | null;
  numericTolerance: number;
  acceptedAnswers: string[];
  caseSensitive: boolean;
};

export async function findQuestion(id: string) {
  const [question] = await db.select({
    id: questions.id,
    type: questions.type,
    stem: questions.stem,
    imageUrl: questions.imageUrl,
    explanation: questions.explanation,
    marks: questions.marks,
    negativeMarks: questions.negativeMarks,
    difficulty: questions.difficulty,
    createdBy: questions.createdBy,
    createdAt: questions.createdAt,
    updatedAt: questions.updatedAt,
  }).from(questions).where(eq(questions.id, id)).limit(1);
  if (!question) return undefined;
  const [revision] = await db.select().from(questionRevisions).where(eq(questionRevisions.questionId, id)).orderBy(desc(questionRevisions.version)).limit(1);
  const optionRows = await db.select({ body: questionOptions.body, isCorrect: questionOptions.isCorrect, sortOrder: questionOptions.sortOrder }).from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.sortOrder));
  const options = optionRows.map((option, index) => ({ ...option, stableKey: String.fromCharCode(65 + index) }));
  return { ...question, revision, options };
}
