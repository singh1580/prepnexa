import { z } from "zod";
import { attemptConflict } from "./errors";

export const entityIdSchema = z.uuid();
export const answerInputSchema = z.object({
  selectedOptionIds: z.array(z.uuid()).max(20).default([]),
  textAnswer: z.string().trim().max(10_000).nullable().default(null),
  numericAnswer: z.string().trim().max(100).nullable().default(null),
  markedForReview: z.boolean().default(false),
  version: z.number().int().min(0).max(1_000_000),
}).strict().superRefine((value, context) => {
  if (new Set(value.selectedOptionIds).size !== value.selectedOptionIds.length) context.addIssue({ code: "custom", path: ["selectedOptionIds"], message: "An option can only be selected once." });
  if (value.numericAnswer !== null && value.numericAnswer !== "" && !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value.numericAnswer)) context.addIssue({ code: "custom", path: ["numericAnswer"], message: "Enter a valid number." });
});

export type AnswerInput = z.infer<typeof answerInputSchema>;

export function normalizeAnswerForQuestion(type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT", input: AnswerInput, allowedOptions: string[]) {
  if (input.selectedOptionIds.some(id => !allowedOptions.includes(id))) throw attemptConflict("One of the selected options is not part of this question.");
  if (type === "SINGLE_CHOICE") {
    if (input.selectedOptionIds.length > 1 || input.textAnswer || input.numericAnswer) throw attemptConflict("Select one option for this question.");
    return { selectedOptionIds: input.selectedOptionIds, textAnswer: null, numericAnswer: null };
  }
  if (type === "MULTIPLE_CHOICE") {
    if (input.textAnswer || input.numericAnswer) throw attemptConflict("Select the applicable options for this question.");
    return { selectedOptionIds: input.selectedOptionIds, textAnswer: null, numericAnswer: null };
  }
  if (type === "NUMERIC") {
    if (input.selectedOptionIds.length || input.textAnswer) throw attemptConflict("Enter a numeric answer for this question.");
    return { selectedOptionIds: [], textAnswer: null, numericAnswer: input.numericAnswer || null };
  }
  if (input.selectedOptionIds.length || input.numericAnswer) throw attemptConflict("Enter a written answer for this question.");
  return { selectedOptionIds: [], textAnswer: input.textAnswer || null, numericAnswer: null };
}
