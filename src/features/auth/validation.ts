import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(10).max(128);

export const registerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password,
});

export const loginInputSchema = z.object({ email, password });
export const emailInputSchema = z.object({ email });
export const tokenInputSchema = z.object({ token: z.string().min(32).max(200) });
export const resetPasswordInputSchema = tokenInputSchema.extend({ password });
export const mfaCodeSchema = z.string().trim().regex(/^\d{6}$/);
export const mfaConfirmInputSchema = z.object({ code: mfaCodeSchema });
export const mfaLoginInputSchema = z.object({
  challengeToken: z.string().min(32).max(200),
  code: mfaCodeSchema.optional(),
  recoveryCode: z.string().trim().min(13).max(20).optional(),
}).refine((input) => Boolean(input.code) !== Boolean(input.recoveryCode), { message: "Provide either an authenticator code or a recovery code." });

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type EmailInput = z.infer<typeof emailInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type MfaLoginInput = z.infer<typeof mfaLoginInputSchema>;
