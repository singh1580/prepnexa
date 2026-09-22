import { z } from "zod";

const optionalDateTime = z.union([z.iso.datetime({ offset: true }), z.literal(""), z.null()]).optional().transform(value => value || null);
const optionalPositiveInt = z.union([z.coerce.number().int().positive(), z.literal(""), z.null()]).optional().transform(value => value === "" || value == null ? null : value);

export const commerceIdSchema = z.uuid();
export const couponCodeSchema = z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_-]+$/).transform(value => value.toUpperCase());

export const couponInputSchema = z.object({
  code: couponCodeSchema,
  type: z.enum(["FIXED", "PERCENT"]),
  value: z.coerce.number().int().positive(),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()).nullable().optional().default("INR"),
  maxDiscountPaise: optionalPositiveInt,
  minOrderPaise: z.coerce.number().int().min(0).default(0),
  totalLimit: optionalPositiveInt,
  perUserLimit: z.coerce.number().int().positive().max(100).default(1),
  startsAt: optionalDateTime,
  endsAt: optionalDateTime,
  active: z.boolean().default(true),
  productIds: z.array(z.uuid()).max(500).default([]).refine(ids => new Set(ids).size === ids.length, "Products must be unique."),
}).strict().superRefine((value, context) => {
  if (value.type === "PERCENT" && value.value > 10_000) context.addIssue({ code: "custom", path: ["value"], message: "Percentage cannot exceed 100%." });
  if (value.type === "FIXED" && !value.currency) context.addIssue({ code: "custom", path: ["currency"], message: "Fixed coupons require a currency." });
  if (value.startsAt && value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time." });
});

export const couponStatusSchema = z.object({ active: z.boolean() }).strict();

export const checkoutInputSchema = z.object({
  productId: z.uuid(),
  couponCode: z.union([couponCodeSchema, z.literal("")]).optional().transform(value => value || null),
  idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9:_-]+$/),
}).strict();

export const refundInputSchema = z.object({
  amountPaise: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3).max(1000),
  revokeAccess: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(16).max(100).regex(/^[A-Za-z0-9:_-]+$/),
}).strict();

export type CouponInput = z.infer<typeof couponInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type RefundInput = z.infer<typeof refundInputSchema>;
