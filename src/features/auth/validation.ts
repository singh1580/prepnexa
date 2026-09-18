import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(320);
const password = z.string().min(10).max(128);

export const registerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password,
});

export const loginInputSchema = z.object({ email, password });

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
