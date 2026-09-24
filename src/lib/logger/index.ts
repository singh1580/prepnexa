import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    censor: "[Redacted]",
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.secret",
      "*.apiKey",
      "*.authorization",
      "*.cookie",
      "DATABASE_URL",
      "DATABASE_URL_UNPOOLED",
      "RESEND_API_KEY",
      "PAYMENT_API_KEY",
      "PAYMENT_WEBHOOK_SECRET",
      "STORAGE_SECRET_ACCESS_KEY",
    ],
  },
});
