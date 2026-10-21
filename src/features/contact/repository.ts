import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import { contactInquiries } from "@/db/schema";

export async function countRecentContactInquiries(email: string, ipHash: string | null, since: Date) {
  const [emailRows, ipRows] = await Promise.all([
    db.select({ value: count() }).from(contactInquiries).where(and(eq(contactInquiries.email, email), gte(contactInquiries.createdAt, since))),
    ipHash
      ? db.select({ value: count() }).from(contactInquiries).where(and(eq(contactInquiries.ipHash, ipHash), gte(contactInquiries.createdAt, since)))
      : Promise.resolve([{ value: 0 }]),
  ]);
  return { email: emailRows[0]?.value ?? 0, ip: ipRows[0]?.value ?? 0 };
}

export async function createContactInquiry(input: typeof contactInquiries.$inferInsert) {
  const [created] = await db.insert(contactInquiries).values(input).returning();
  if (!created) throw new Error("Contact enquiry was not created");
  return created;
}

export async function updateContactDelivery(input: { id: string; status: "SENT" | "FAILED" | "NOT_CONFIGURED"; providerMessageId?: string | null; lastError?: string | null }) {
  await db.update(contactInquiries).set({
    emailDeliveryStatus: input.status,
    providerMessageId: input.providerMessageId ?? null,
    lastError: input.lastError?.slice(0, 2000) ?? null,
    updatedAt: new Date(),
  }).where(eq(contactInquiries.id, input.id));
}

