import { AppError } from "@/lib/errors/app-error";
import { listManagedReviews, listReviewableProducts, moderateReview, saveStudentReview } from "./repository";
import type { z } from "zod";
import type { moderateReviewSchema, submitReviewSchema } from "./validation";

export const getStudentReviewWorkspace = (userId: string) => listReviewableProducts(userId);
export const getManagedReviews = () => listManagedReviews();

export async function submitStudentReview(userId: string, input: z.infer<typeof submitReviewSchema>) {
  const result = await saveStudentReview(userId, input);
  if (!result) throw new AppError("PURCHASE_REQUIRED", "Only learners who purchased this package can review it.", 403);
  return { id: result.id, status: "PENDING" as const };
}

export async function reviewModeration(reviewId: string, adminId: string, input: z.infer<typeof moderateReviewSchema>, requestId: string) {
  const result = await moderateReview(reviewId, adminId, input, requestId);
  if (!result) throw new AppError("REVIEW_NOT_FOUND", "This review no longer exists.", 404);
  return { id: result.id, status: result.status };
}
