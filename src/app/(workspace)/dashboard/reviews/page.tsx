import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { getStudentReviewWorkspace } from "@/features/reviews/service";
import { StudentReviewForm } from "@/features/reviews/ui/review-actions";

export const metadata={title:"Review & Feedback"};
export default async function Page(){const auth=await requireWorkspace();if(auth.admin)redirect("/admin/reviews");const[packages,notifications]=await Promise.all([getStudentReviewWorkspace(auth.user.id),getStudentNotifications(auth.user.id)]);const statusLabel={PENDING:"Submitted",APPROVED:"Published",REJECTED:"Update requested"} as const;return <WorkspaceShell admin={false} name={auth.user.name} email={auth.user.email} section="reviews" unreadNotifications={notifications.unreadCount}>
  <header className="student-page-heading"><div><span className="eyebrow">YOUR EXPERIENCE</span><h1>Review &amp; Feedback</h1><p>Rate packages you purchased and share suggestions directly with the Prepstore team.</p></div></header>
  {packages.length?<div className="student-review-list">{packages.map(item=><article className="panel student-review-card" key={item.productId}><header><div><h2>{item.name}</h2><p>Purchased {item.purchasedAt?new Date(item.purchasedAt).toLocaleDateString("en-IN",{dateStyle:"medium"}):"through Prepstore"}</p></div>{item.reviewStatus?<span className={`review-status ${item.reviewStatus.toLowerCase()}`}>{statusLabel[item.reviewStatus]}</span>:<span className="review-status not-submitted">Not submitted</span>}</header>{item.reviewStatus==="REJECTED"&&item.moderationNote?<p className="review-moderator-note"><strong>Update requested:</strong> {item.moderationNote}</p>:null}<details open={!item.reviewId||item.reviewStatus==="REJECTED"}><summary>{item.reviewId?"View or update your review":"Write review & feedback"}</summary><StudentReviewForm productId={item.productId} initial={item.reviewId?{rating:item.rating!,comment:item.comment!,feedback:item.feedback}:undefined}/></details><Link className="text-link" href={`/packages/${item.slug}`}>View package details</Link></article>)}</div>:<section className="panel empty-state"><h2>No purchased packages to review</h2><p>After a completed purchase, the package will appear here for rating and feedback.</p><Link className="button" href="/packages">Explore packages</Link></section>}
  </WorkspaceShell>}
