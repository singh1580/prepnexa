import { z } from "zod";

export const submitReviewSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Write at least 10 characters about your experience.").max(1000),
  feedback: z.string().trim().max(2000).optional().transform(value => value || null),
});

export const moderateReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(1000).optional().transform(value => value || null),
}).superRefine((value, context) => {
  if (value.status === "REJECTED" && !value.note) context.addIssue({ code: "custom", path: ["note"], message: "Add a short reason so the learner knows what to change." });
});
