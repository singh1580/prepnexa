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
  const liveRefresh = readFileSync(
    "src/features/operations/ui/support-live-refresh.tsx",
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

  it("uses one support identity and keeps both conversations current", () => {
    expect(adminDetail).toContain("Prepstore Support");
    expect(adminDetail).toContain("<PrepstoreIcon />");
    expect(adminDetail).not.toContain(' : "Admin"');
    expect(adminDetail).toContain("<SupportLiveRefresh revision=");
    expect(studentDetail).toContain("<SupportLiveRefresh revision=");
    expect(adminDetail).toContain('data-support-thread="true"');
    expect(studentDetail).toContain('data-support-thread="true"');
    expect(liveRefresh).toContain("SUPPORT_REFRESH_INTERVAL_MS = 4_000");
    expect(liveRefresh).toContain('document.visibilityState === "visible"');
    expect(liveRefresh).toContain('window.addEventListener("focus"');
    expect(liveRefresh).toContain("thread?.scrollTo");
  });

  it("uses the same message hierarchy in admin and student conversations", () => {
    expect(adminDetail).toContain('"support-message customer"');
    expect(adminDetail).toContain('"support-message support"');
    expect(adminDetail).toContain('"support-message internal-note"');
    expect(adminDetail).toContain("thread-avatar");
    expect(adminDetail).not.toContain("student-message");
    expect(adminDetail).not.toContain("admin-message");
  });
});
