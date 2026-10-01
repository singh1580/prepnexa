import { z } from "zod";

export const operationIdSchema = z.string().uuid();
export const supportCategorySchema = z.enum(["ACCOUNT", "PAYMENT", "TEST", "MATERIAL", "OTHER"]);
export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(5, "Subject must contain at least 5 characters.").max(200),
  category: supportCategorySchema,
  orderId: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(5, "Message must contain at least 5 characters.").max(4000),
});
export const supportReplySchema = z.object({ body: z.string().trim().min(2).max(4000) });
export const managedSupportReplySchema = supportReplySchema.extend({ internal: z.boolean().default(false) });
export const notificationCampaignSchema = z.object({
  audience: z.enum(["ALL_STUDENTS", "PACKAGE_CUSTOMERS", "INACTIVE_STUDENTS"]),
  productId: z.uuid().nullable().optional(),
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(3).max(500),
  channel: z.enum(["EMAIL", "IN_APP"]),
}).superRefine((value, context) => {
  if (value.audience === "PACKAGE_CUSTOMERS" && !value.productId) context.addIssue({ code: "custom", path: ["productId"], message: "Choose a product package." });
});
export const managedStudentStatusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });
export const managedTicketUpdateSchema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_STUDENT", "RESOLVED", "CLOSED"]), priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]) });

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
export type SupportReplyInput = z.infer<typeof supportReplySchema>;
export type ManagedSupportReplyInput = z.infer<typeof managedSupportReplySchema>;
export type NotificationCampaignInput = z.infer<typeof notificationCampaignSchema>;
