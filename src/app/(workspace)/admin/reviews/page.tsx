import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getManagedReviews } from "@/features/reviews/service";
import { ReviewModerationActions } from "@/features/reviews/ui/review-actions";
import { AdminPageHeader } from "@/components/admin-page-header";

export const metadata = { title: "Reviews & feedback" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const auth = await requireWorkspace(true);
  const requested = (await searchParams).status;
  const status =
    (["PENDING", "APPROVED", "REJECTED", "ALL"] as const).find(
      (value) => value === requested,
    ) ?? "PENDING";
  const reviews = await getManagedReviews();
  const visible =
    status === "ALL"
      ? reviews
      : reviews.filter((review) => review.status === status);
  const counts = {
    PENDING: reviews.filter((x) => x.status === "PENDING").length,
    APPROVED: reviews.filter((x) => x.status === "APPROVED").length,
    REJECTED: reviews.filter((x) => x.status === "REJECTED").length,
  };
  const statusLabel = {
    PENDING: "Pending",
    APPROVED: "Published",
    REJECTED: "Hidden",
  } as const;
  const tabClass = (active: boolean) =>
    `inline-flex min-h-10 items-center gap-2 border-b-2 px-3 py-2 text-sm font-bold whitespace-nowrap ${active ? "border-prep-orange text-prep-orange-dark" : "border-transparent text-prep-muted hover:text-prep-ink"}`;
  const reviewStatusClass = (value: (typeof reviews)[number]["status"]) =>
    `inline-flex min-h-7 items-center rounded-full px-[0.58rem] py-[0.32rem] text-[0.64rem] font-extrabold tracking-[0.04em] uppercase whitespace-nowrap ${
      value === "APPROVED"
        ? "bg-[#e8f6ed] text-[#237544]"
        : value === "REJECTED"
          ? "bg-[#fff0ef] text-[#a33d35]"
          : "bg-[#fff3dd] text-[#9b640d]"
    }`;
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="reviews"
    >
      <AdminPageHeader
        title="Reviews & feedback"
        description="Moderate verified-purchase reviews and read private learner feedback."
      />
      <nav
        className="mb-4 flex max-w-full gap-2 overflow-x-auto border-b border-prep-line"
        aria-label="Review status"
      >
        <Link
          className={tabClass(status === "PENDING")}
          href="/admin/reviews?status=PENDING"
        >
          Pending <b>{counts.PENDING}</b>
        </Link>
        <Link
          className={tabClass(status === "APPROVED")}
          href="/admin/reviews?status=APPROVED"
        >
          Published <b>{counts.APPROVED}</b>
        </Link>
        <Link
          className={tabClass(status === "REJECTED")}
          href="/admin/reviews?status=REJECTED"
        >
          Hidden <b>{counts.REJECTED}</b>
        </Link>
        <Link
          className={tabClass(status === "ALL")}
          href="/admin/reviews?status=ALL"
        >
          All <b>{reviews.length}</b>
        </Link>
      </nav>
      {visible.length ? (
        <div className="grid gap-4">
          {visible.map((review) => (
            <article
              className="rounded-[0.65rem] border border-prep-line bg-white p-[1.15rem] shadow-[0_1px_3px_rgba(16,24,40,0.04)]"
              key={review.id}
            >
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="m-0 text-[1.05rem]">{review.productName}</h2>
                  <p className="mt-[0.3rem] mb-0 text-[0.76rem] text-[#777e83]">
                    {review.studentName} · {review.studentEmail}
                  </p>
                </div>
                <span className={reviewStatusClass(review.status)}>
                  {statusLabel[review.status]}
                </span>
              </header>
              <div
                className="my-[0.85rem] tracking-[0.06em] text-[#e84916] [&_b]:ml-2 [&_b]:tracking-normal [&_b]:text-[#30363a]"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)} <b>{review.rating}/5</b>
              </div>
              <blockquote className="my-2 border-l-[3px] border-[#e84916] bg-[#faf9f7] p-4 leading-[1.65] text-[#343a3f]">
                {review.comment}
              </blockquote>
              {review.feedback ? (
                <section className="rounded-[0.45rem] border border-[#e5e2de] bg-white p-[0.8rem]">
                  <strong>Private feedback</strong>
                  <p className="mt-[0.35rem] mb-0 text-[#626a70]">
                    {review.feedback}
                  </p>
                </section>
              ) : null}
              <footer className="mt-[0.85rem] flex items-center justify-between gap-4 text-[#777e83]">
                <small>
                  Submitted{" "}
                  {new Date(review.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </small>
                <Link
                  className="text-[0.75rem] font-[750] text-prep-orange"
                  href={`/packages/${review.productSlug}`}
                >
                  View package
                </Link>
              </footer>
              <ReviewModerationActions
                reviewId={review.id}
                currentStatus={review.status}
              />
            </article>
          ))}
        </div>
      ) : (
        <section className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-prep-line bg-white p-8 text-center">
          <h2>
            {status === "ALL"
              ? "No reviews"
              : `No ${statusLabel[status].toLowerCase()} reviews`}
          </h2>
          <p>New verified-purchase submissions will appear here.</p>
        </section>
      )}
    </WorkspaceShell>
  );
}
