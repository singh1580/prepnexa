import { describe, expect, it } from "vitest";
import { createSupportTicketSchema, managedStudentStatusSchema, managedTicketUpdateSchema, operationIdSchema, supportReplySchema } from "../../src/features/operations/validation";
import { hasAnyOperationsPermission, OPERATIONS_PERMISSIONS } from "../../src/features/operations/permissions";

describe("operations validation", () => {
  it("accepts a trimmed support request", () => {
    const result = createSupportTicketSchema.parse({ subject: "  Payment issue  ", category: "PAYMENT", orderId: null, message: "  Please check this payment.  " });
    expect(result.subject).toBe("Payment issue");
    expect(result.message).toBe("Please check this payment.");
  });

  it("rejects unsupported categories and empty messages", () => {
    expect(createSupportTicketSchema.safeParse({ subject: "Need help", category: "SALES", message: "Please help" }).success).toBe(false);
    expect(createSupportTicketSchema.safeParse({ subject: "Need help", category: "OTHER", message: " " }).success).toBe(false);
  });

  it("validates related order and route identifiers", () => {
    const id = crypto.randomUUID();
    expect(createSupportTicketSchema.safeParse({ subject: "Order access", category: "PAYMENT", orderId: id, message: "Access is missing" }).success).toBe(true);
    expect(operationIdSchema.safeParse(id).success).toBe(true);
    expect(operationIdSchema.safeParse("not-an-id").success).toBe(false);
  });

  it("limits support reply content", () => {
    expect(supportReplySchema.safeParse({ body: "Thanks" }).success).toBe(true);
    expect(supportReplySchema.safeParse({ body: "x" }).success).toBe(false);
    expect(supportReplySchema.safeParse({ body: "x".repeat(4001) }).success).toBe(false);
  });

  it("restricts managed student and ticket states", () => {
    expect(managedStudentStatusSchema.safeParse({ status: "SUSPENDED" }).success).toBe(true);
    expect(managedStudentStatusSchema.safeParse({ status: "DELETED" }).success).toBe(false);
    expect(managedTicketUpdateSchema.safeParse({ status: "WAITING_FOR_STUDENT", priority: "URGENT" }).success).toBe(true);
    expect(managedTicketUpdateSchema.safeParse({ status: "UNKNOWN", priority: "NORMAL" }).success).toBe(false);
  });

  it("detects only explicit operational grants", () => {
    expect(hasAnyOperationsPermission([OPERATIONS_PERMISSIONS.manageSupport])).toBe(true);
    expect(hasAnyOperationsPermission(["exam.manage", "question.publish"])).toBe(false);
  });
});
