import { z } from "zod";

export const contactCategorySchema = z.enum([
  "GENERAL",
  "BUSINESS",
  "CONTENT_PERMISSION",
  "PRIVACY",
  "GRIEVANCE",
]);

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(320),
  phone: z.union([
    z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number."),
    z.literal(""),
  ]).optional().transform((value) => value || null),
  category: contactCategorySchema,
  subject: z.string().trim().min(5, "Enter a clear subject.").max(180),
  message: z.string().trim().min(20, "Please add at least 20 characters so we can understand your request.").max(5000),
  website: z.string().max(200).optional().default(""),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

