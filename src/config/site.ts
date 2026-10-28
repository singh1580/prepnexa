const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const SITE_URL = new URL(configuredUrl || "https://prepstore.in");
export const SITE_ORIGIN = SITE_URL.origin;
export const SITE_NAME = "Prepstore";
export const SITE_DESCRIPTION =
  "Exam preparation packages, practice tests and study material for competitive exams in India.";

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
