import { z } from "zod";

const optionalSecret = z.preprocess(value => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().min(8).optional());

export const envSchema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Prepstore"), NEXT_PUBLIC_APP_URL: z.url(),
  DATABASE_URL: z.string().startsWith("postgresql://"), DATABASE_URL_UNPOOLED: z.string().startsWith("postgresql://"),
  AUTH_SECRET: z.string().min(32), PASSWORD_PEPPER: z.string().min(16),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  MAX_ACTIVE_SESSIONS: z.coerce.number().int().min(1).max(10).default(2),
  EMAIL_VERIFICATION_OTP_TTL_MINUTES: z.coerce.number().int().min(5).max(30).default(10),
  EMAIL_VERIFICATION_RESEND_SECONDS: z.coerce.number().int().min(30).max(300).default(60),
  EMAIL_VERIFICATION_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  EMAIL_VERIFICATION_MAX_SENDS_PER_HOUR: z.coerce.number().int().min(2).max(10).default(3),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  LOGIN_IP_MAX_ATTEMPTS: z.coerce.number().int().min(10).max(100).default(25),
  LOGIN_WINDOW_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  REGISTER_IP_MAX_ATTEMPTS: z.coerce.number().int().min(2).max(50).default(5),
  PASSWORD_RESET_EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(2).max(20).default(3),
  PASSWORD_RESET_IP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(100).default(10),
  MFA_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  MFA_IP_MAX_ATTEMPTS: z.coerce.number().int().min(5).max(100).default(20),
  MFA_ENCRYPTION_KEY: z.string().min(32).optional(),
  MFA_CHALLENGE_TTL_MINUTES: z.coerce.number().int().min(2).max(15).default(5),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24).default(12),
  PAYMENT_PROVIDER: z.enum(["mock","razorpay"]).default("mock"), PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: optionalSecret, RAZORPAY_KEY_SECRET: optionalSecret, RAZORPAY_WEBHOOK_SECRET: optionalSecret,
  RESEND_API_KEY: z.string().trim().min(1).optional(), EMAIL_FROM: z.string().trim().min(1).optional(),
  STORAGE_PROVIDER: z.enum(["local","s3"]).default("local"), STORAGE_BUCKET: z.string().optional(), STORAGE_REGION: z.string().optional(),
  STORAGE_ENDPOINT_URL: z.url().optional(), STORAGE_ACCESS_KEY_ID: z.string().optional(), STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_LOCAL_ROOT: z.string().default(".local-storage"), STORAGE_MAX_FILE_MB: z.coerce.number().int().min(1).max(100).default(25),
  MATERIAL_LINK_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300)
}).superRefine((value, context) => {
  if (Boolean(value.RESEND_API_KEY) !== Boolean(value.EMAIL_FROM)) {
    context.addIssue({
      code: "custom",
      path: value.RESEND_API_KEY ? ["EMAIL_FROM"] : ["RESEND_API_KEY"],
      message: "RESEND_API_KEY and EMAIL_FROM must be configured together.",
    });
  }

  if (value.NODE_ENV === "production" && value.EMAIL_FROM?.toLowerCase().includes("@resend.dev")) {
    context.addIssue({
      code: "custom",
      path: ["EMAIL_FROM"],
      message: "A verified sender domain is required in production.",
    });
  }

  if (value.NODE_ENV === "production" && (!value.RESEND_API_KEY || !value.EMAIL_FROM)) {
    context.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "Transactional email is required in production." });
  }

  if (value.NODE_ENV === "production" && !value.MFA_ENCRYPTION_KEY) {
    context.addIssue({ code: "custom", path: ["MFA_ENCRYPTION_KEY"], message: "MFA_ENCRYPTION_KEY is required in production." });
  }

  if (value.NODE_ENV === "production" && new URL(value.NEXT_PUBLIC_APP_URL).protocol !== "https:") {
    context.addIssue({ code: "custom", path: ["NEXT_PUBLIC_APP_URL"], message: "NEXT_PUBLIC_APP_URL must use HTTPS in production." });
  }

  if (value.NODE_ENV === "production" && value.STORAGE_PROVIDER !== "s3") {
    context.addIssue({ code: "custom", path: ["STORAGE_PROVIDER"], message: "Private S3-compatible storage is required in production." });
  }

  if (value.STORAGE_PROVIDER === "s3") {
    for (const field of ["STORAGE_BUCKET", "STORAGE_REGION", "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"] as const) {
      if (!value[field]) context.addIssue({ code: "custom", path: [field], message: `${field} is required when STORAGE_PROVIDER=s3.` });
    }
  }

  if (value.PAYMENT_PROVIDER === "razorpay") {
    if (!value.RAZORPAY_KEY_ID) context.addIssue({ code: "custom", path: ["RAZORPAY_KEY_ID"], message: "RAZORPAY_KEY_ID is required when Razorpay is selected." });
    if (!value.RAZORPAY_KEY_SECRET) context.addIssue({ code: "custom", path: ["RAZORPAY_KEY_SECRET"], message: "RAZORPAY_KEY_SECRET is required when Razorpay is selected." });
    if (value.NODE_ENV === "production" && !value.RAZORPAY_WEBHOOK_SECRET) context.addIssue({ code: "custom", path: ["RAZORPAY_WEBHOOK_SECRET"], message: "RAZORPAY_WEBHOOK_SECRET is required in production." });
  }
  if (value.NODE_ENV === "production" && value.PAYMENT_PROVIDER !== "razorpay") {
    context.addIssue({ code: "custom", path: ["PAYMENT_PROVIDER"], message: "Razorpay is required in production." });
  }
});

export const env = envSchema.parse(process.env);
