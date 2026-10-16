import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("support workflow ownership", () => {
  const adminList = readFileSync(
    "src/app/(workspace)/admin/support/page.tsx",
    "utf8",
  );
  const adminDetail = readFileSync(
    "src/app/(workspace)/admin/support/[id]/page.tsx",
    "utf8",
  );
  const studentDetail = readFileSync(
    "src/app/(workspace)/dashboard/support/[id]/page.tsx",
    "utf8",
  );
  const studentActions = readFileSync(
    "src/features/operations/ui/student-actions.tsx",
    "utf8",
  );

  it("gives administrators an explicit route to view and manage every ticket", () => {
    expect(adminList).toContain("<th>Actions</th>");
    expect(adminList).toContain('href={`/admin/support/${ticket.id}`}');
    expect(adminList).toContain("View ticket");
    expect(adminDetail).toContain("<ManagedTicketActions");
    expect(adminList).not.toContain("support-split-detail");
    expect(adminList).not.toContain("?ticket=");
  });

  it("keeps administrative status controls out of the student ticket UI", () => {
    expect(studentDetail).not.toContain("SupportResolveButton");
    expect(studentActions).not.toContain("Mark as Resolved");
    expect(
      existsSync("src/app/api/operations/support/[id]/resolve/route.ts"),
    ).toBe(false);
  });
});
