import { z } from "zod";
const schema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PrepNexa"), NEXT_PUBLIC_APP_URL: z.url(),
  DATABASE_URL: z.string().startsWith("postgresql://"), DATABASE_URL_UNPOOLED: z.string().startsWith("postgresql://"),
  AUTH_SECRET: z.string().min(32), PASSWORD_PEPPER: z.string().min(16),
  RAZORPAY_KEY_ID: z.string().optional(), RAZORPAY_KEY_SECRET: z.string().optional(), RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(), EMAIL_FROM: z.string().optional(), STORAGE_BUCKET: z.string().optional(), STORAGE_REGION: z.string().optional(), STORAGE_ACCESS_KEY_ID: z.string().optional(), STORAGE_SECRET_ACCESS_KEY: z.string().optional()
});
export const env = schema.parse(process.env);
