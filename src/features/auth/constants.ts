export const TOKEN_PURPOSE = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type TokenPurpose = (typeof TOKEN_PURPOSE)[keyof typeof TOKEN_PURPOSE];
