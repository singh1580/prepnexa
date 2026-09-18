import { z } from "zod";
const schema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("PrepNexa"), NEXT_PUBLIC_APP_URL: z.url(),
  DATABASE_URL: z.string().startsWith("postgresql://"), DATABASE_URL_UNPOOLED: z.string().startsWith("postgresql://"),
  AUTH_SECRET: z.string().min(32), PASSWORD_PEPPER: z.string().min(16),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  LOGIN_IP_MAX_ATTEMPTS: z.coerce.number().int().min(10).max(100).default(25),
  LOGIN_WINDOW_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  PAYMENT_PROVIDER: z.string().default("mock"), PAYMENT_API_KEY: z.string().optional(), PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(), EMAIL_FROM: z.string().optional(), STORAGE_BUCKET: z.string().optional(), STORAGE_REGION: z.string().optional(), STORAGE_ACCESS_KEY_ID: z.string().optional(), STORAGE_SECRET_ACCESS_KEY: z.string().optional()
});
export const env = schema.parse(process.env);
