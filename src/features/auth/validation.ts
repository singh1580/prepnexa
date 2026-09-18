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

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type EmailInput = z.infer<typeof emailInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
