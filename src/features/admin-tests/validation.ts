import { z } from "zod";

export const testIdSchema = z.uuid();
export const testInputSchema = z.object({
  examId: z.uuid(), title: z.string().trim().min(3).max(200), mode: z.enum(["PRACTICE", "MOCK", "LIVE"]),
  durationMinutes: z.coerce.number().int().min(1).max(600), instructions: z.string().trim().max(10_000).optional().default(""),
  maxAttempts: z.coerce.number().int().min(1).max(100), shuffleQuestions: z.boolean().default(true), shuffleOptions: z.boolean().default(true),
}).strict();
export const sectionInputSchema = z.object({ title: z.string().trim().min(2).max(160), durationMinutes: z.number().int().min(1).max(600).nullable().default(null), sortOrder: z.coerce.number().int().min(0).max(1_000) }).strict();
export const assignmentInputSchema = z.object({ questionId: z.uuid(), sortOrder: z.coerce.number().int().min(0).max(10_000) }).strict();
export const scheduleInputSchema = z.object({ startsAt: z.iso.datetime(), endsAt: z.iso.datetime(), lateJoinMinutes: z.coerce.number().int().min(0).max(180), resultReleaseAt: z.iso.datetime().nullable().default(null), rankingEnabled: z.boolean().default(false), cohortKey: z.string().trim().max(100).optional().default("") }).strict().superRefine((value, context) => {
  if (new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time." });
  if (value.resultReleaseAt && new Date(value.resultReleaseAt) < new Date(value.endsAt)) context.addIssue({ code: "custom", path: ["resultReleaseAt"], message: "Results cannot release before the test ends." });
});
