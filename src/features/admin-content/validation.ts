import { z } from "zod";

const name = z.string().trim().min(2).max(180);
const sortOrder = z.coerce.number().int().min(0).max(10_000);

export const entityIdSchema = z.uuid();
export const examInputSchema = z.object({
  name,
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  description: z.string().trim().max(4_000).optional().default(""),
}).strict();
export const subjectInputSchema = z.object({ name: name.max(160), sortOrder }).strict();
export const topicInputSchema = z.object({ name: name.max(160), sortOrder }).strict();

const optionSchema = z.object({
  stableKey: z.string().trim().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  body: z.string().trim().min(1).max(4_000),
  isCorrect: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
}).strict();

export const questionInputSchema = z.object({
  topicId: z.uuid(),
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "NUMERIC", "TEXT"]),
  stem: z.string().trim().min(10).max(20_000),
  explanation: z.string().trim().max(20_000).optional().default(""),
  marks: z.coerce.number().positive().max(1_000),
  negativeMarks: z.coerce.number().min(0).max(1_000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  options: z.array(optionSchema).max(8).default([]),
  numericAnswer: z.number().finite().nullable().default(null),
  numericTolerance: z.number().finite().min(0).max(1_000).default(0),
  acceptedAnswers: z.array(z.string().trim().min(1).max(1_000)).max(20).default([]),
  caseSensitive: z.boolean().default(false),
}).strict().superRefine((value, context) => {
  if (value.negativeMarks > value.marks) context.addIssue({ code: "custom", path: ["negativeMarks"], message: "Negative marks cannot exceed marks." });
  const choice = value.type === "SINGLE_CHOICE" || value.type === "MULTIPLE_CHOICE";
  if (choice && value.options.length < 2) context.addIssue({ code: "custom", path: ["options"], message: "Choice questions need at least two options." });
  const correct = value.options.filter((option) => option.isCorrect).length;
  if (value.type === "SINGLE_CHOICE" && correct !== 1) context.addIssue({ code: "custom", path: ["options"], message: "Select exactly one correct option." });
  if (value.type === "MULTIPLE_CHOICE" && correct < 2) context.addIssue({ code: "custom", path: ["options"], message: "Select at least two correct options." });
  if (!choice && value.options.length) context.addIssue({ code: "custom", path: ["options"], message: "This question type cannot contain options." });
  if (value.type === "NUMERIC" && value.numericAnswer === null) context.addIssue({ code: "custom", path: ["numericAnswer"], message: "Enter the accepted numeric answer." });
  if (value.type === "TEXT" && !value.acceptedAnswers.length) context.addIssue({ code: "custom", path: ["acceptedAnswers"], message: "Enter at least one accepted answer." });
  if (new Set(value.options.map((option) => option.stableKey)).size !== value.options.length) context.addIssue({ code: "custom", path: ["options"], message: "Option keys must be unique." });
  if (new Set(value.options.map((option) => option.sortOrder)).size !== value.options.length) context.addIssue({ code: "custom", path: ["options"], message: "Option order must be unique." });
});

export const reviewActionSchema = z.object({ action: z.enum(["APPROVE", "RETURN"]) }).strict();
