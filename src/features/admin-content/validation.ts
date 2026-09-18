import { z } from "zod";

const name = z.string().trim().min(2).max(180);
const sortOrder = z.coerce.number().int().min(0).max(10_000);

export const entityIdSchema = z.uuid();
export const examInputSchema = z.object({
  name,
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  description: z.string().trim().max(4_000).optional().default(""),
}).strict();
export const subjectInputSchema = z.object({ name: name.max(160), sortOrder }).strict();
export const topicInputSchema = z.object({ name: name.max(160), sortOrder }).strict();
