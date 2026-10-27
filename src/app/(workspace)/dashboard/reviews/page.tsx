import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentReviewWorkspace } from "@/features/reviews/service";
import { StudentReviewForm } from "@/features/reviews/ui/review-actions";

export const metadata = { title: "Review & Feedback" };
export default async function Page() {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin/reviews");
  const [packages, notifications] = await Promise.all([
    getStudentReviewWorkspace(auth.user.id),
    getStudentNotifications(auth.user.id),
  ]);
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="reviews"
      unreadNotifications={notifications.unreadCount}
    >
      <header className="mb-[1.1rem] flex items-center gap-5 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-[.8rem]">
        <div className="min-w-0">
          <span className="text-xs font-extrabold tracking-[.18em] text-prep-orange">
            YOUR EXPERIENCE
          </span>
          <h1 className="mt-[.3rem] mb-[.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-.04em] break-words">
            Review &amp; Feedback
          </h1>
          <p className="m-0 max-w-3xl text-[.88rem] text-[#687077]">
            Rate packages you purchased and share suggestions directly with the
            Prepstore team.
          </p>
        </div>
      </header>
      {packages.length ? (
        <div className="grid gap-4">
          {packages.map((item) => (
            <article
              className="rounded-[.8rem] border border-[#e4dfd8] bg-white p-[1.15rem]"
              key={item.productId}
            >
              <header className="flex items-start justify-between gap-4 max-[700px]:flex-col">
                <div className="min-w-0">
                  <h2 className="m-0 text-[1.05rem] break-words">
                    {item.name}
                  </h2>
                  <p className="mt-[.3rem] mb-0 text-[.76rem] text-[#777e83]">
                    Purchased{" "}
                    {item.purchasedAt
                      ? new Date(item.purchasedAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })
                      : "through Prepstore"}
                  </p>
                </div>
              </header>
              <details className="my-4" open={!item.reviewId}>
                <summary className="cursor-pointer border-y border-[#ebe8e4] py-3 text-[.78rem] font-bold text-prep-orange">
                  {item.reviewId
                    ? "View or update your review"
                    : "Write review & feedback"}
                </summary>
                <StudentReviewForm
                  productId={item.productId}
                  initial={
                    item.reviewId
                      ? {
                          rating: item.rating!,
                          comment: item.comment!,
                          feedback: item.feedback,
                        }
                      : undefined
                  }
                />
              </details>
              <Link
                className="mt-[1.1rem] block text-center text-[.7rem] font-bold text-prep-orange"
                href={`/packages/${item.slug}`}
              >
                View package details
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <section className="mt-4 rounded-xl border border-dashed border-[#d8d5d0] bg-white px-6 py-14 text-center [&_p]:mx-auto [&_p]:mt-2 [&_p]:max-w-[38rem] [&_p]:text-sm [&_p]:text-prep-muted">
          <h2>No purchased packages to review</h2>
          <p>
            After a completed purchase, the package will appear here for rating
            and feedback.
          </p>
          <Link
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-prep-control bg-prep-orange px-5 font-bold text-white hover:bg-prep-orange-dark"
            href="/packages"
          >
            Explore packages
          </Link>
        </section>
      )}
    </WorkspaceShell>
  );
}
