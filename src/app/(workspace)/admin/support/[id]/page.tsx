import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedSupportTicket } from "@/features/operations/service";
import { ManagedTicketActions } from "@/features/operations/ui/admin-actions";
import { AppError } from "@/lib/errors/app-error";
import { PrepstoreIcon } from "@/components/brand";
import { SupportLiveRefresh } from "@/features/operations/ui/support-live-refresh";

const ticketStatusClass = (status: string) =>
  status === "RESOLVED"
    ? "border-[#bfe2cc] bg-[#e7f4ec] text-[#276448]"
    : status === "CLOSED"
      ? "border-[#d9dce0] bg-[#f0f1f2] text-[#5f666d]"
      : "border-[#f1d79b] bg-[#fff4d9] text-[#8a5b13]";
export const metadata = { title: "Manage support ticket" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspacePermission(
    OPERATIONS_PERMISSIONS.manageSupport,
  );
  let ticket: Awaited<ReturnType<typeof getManagedSupportTicket>>;
  try {
    ticket = await getManagedSupportTicket((await params).id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="support"
    >
      <SupportLiveRefresh revision={ticket.messages.at(-1)?.id ?? "empty"} />
      <Link
        className="inline-flex min-h-11 items-center font-bold text-prep-orange-dark hover:underline"
        href="/admin/support"
      >
        ← Support tickets
      </Link>
      <section className="mt-[0.85rem] overflow-hidden rounded-[0.75rem] border border-prep-line bg-white shadow-[0_1px_2px_rgba(24,27,30,0.03)] max-[700px]:mx-[-0.15rem] max-[700px]:rounded-[0.55rem]">
        <header className="flex items-center justify-between gap-4 border-b border-prep-line px-5 py-4 max-[700px]:items-start max-[700px]:px-[0.85rem]">
          <div>
            <span className="eyebrow">#{ticket.id.slice(0, 8)}</span>
            <h1 className="mt-1 text-xl font-bold text-prep-ink">
              {ticket.subject}
            </h1>
          </div>
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-[0.68rem] font-bold whitespace-nowrap ${ticketStatusClass(ticket.status)}`}
          >
            {ticket.status.replaceAll("_", " ")}
          </span>
        </header>
        <div className="flex items-center gap-3 border-b border-prep-line px-5 py-[0.85rem] max-[650px]:flex-wrap max-[650px]:items-start max-[700px]:px-[0.85rem] [&>div]:grid [&>div]:gap-0.5 [&>div]:text-[0.75rem] [&>div:nth-last-child(-n+2)]:ml-auto max-[650px]:[&>div:nth-last-child(-n+2)]:ml-0 max-[650px]:[&>div:nth-last-child(-n+2)]:w-full [&_small]:text-prep-muted">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1dfd1] text-xs font-extrabold text-[#675246]">
            {ticket.studentName.slice(0, 1)}
          </span>
          <div>
            <strong>{ticket.studentName}</strong>
            <small>{ticket.email}</small>
          </div>
          {ticket.orderId && (
            <div>
              <small>Related order</small>
              <strong>#{ticket.orderId.slice(0, 8)}</strong>
            </div>
          )}
          <div>
            <small>Created</small>
            <strong>
              {new Date(ticket.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </strong>
          </div>
        </div>
        <section
          className="grid bg-white px-5 py-[0.35rem] max-[700px]:px-[0.85rem]"
          data-support-thread="true"
        >
          {ticket.messages.map((item) => (
            <article
              className="grid w-full grid-cols-[2.35rem_minmax(0,1fr)] items-start gap-[0.7rem] border-t border-[#efedea] py-[0.9rem] first:border-t-0 max-[700px]:grid-cols-[2.2rem_minmax(0,1fr)] max-[700px]:gap-[0.6rem] max-[700px]:py-[0.8rem]"
              key={item.id}
            >
              <i
                className={`grid size-8 place-items-center rounded-full text-[0.62rem] font-extrabold not-italic ${item.internal ? "bg-[#fff0bd] text-[#795b00]" : item.student ? "bg-[#f1dfd1] text-[#675246]" : "bg-prep-orange text-white [&_svg]:size-5"}`}
              >
                {item.student ? (
                  ticket.studentName.slice(0, 2).toUpperCase()
                ) : item.internal ? (
                  "N"
                ) : (
                  <PrepstoreIcon />
                )}
              </i>
              <div className="min-w-0">
                <header className="flex min-w-0 flex-wrap items-baseline gap-x-[0.7rem] gap-y-[0.2rem]">
                  <strong className="min-w-0 overflow-hidden text-[0.8rem] text-ellipsis whitespace-nowrap text-[#282c30]">
                    {item.internal
                      ? "Internal note"
                      : item.student
                        ? ticket.studentName
                        : "Prepstore Support"}
                  </strong>
                  <small className="text-[0.68rem] whitespace-nowrap text-[#747b80] max-[380px]:w-full">
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                </header>
                <p
                  className={`mt-[0.45rem] w-fit rounded-[0.55rem] px-[0.8rem] py-[0.68rem] text-[0.78rem] leading-[1.55] [overflow-wrap:anywhere] max-[700px]:max-w-full ${item.internal ? "max-w-[min(52rem,100%)] bg-[#fff8dc]" : item.student ? "max-w-[min(46rem,92%)] bg-[#f5f5f3]" : "max-w-[min(46rem,92%)] bg-[#fff1ea]"}`}
                >
                  {item.body}
                </p>
                {item.attachmentObjectKey && (
                  <a
                    className="mt-2 inline-flex items-center gap-2 rounded-prep-control border border-prep-line px-3 py-2 text-[0.72rem] font-bold text-prep-orange-dark"
                    href={`/api/operations/support/messages/${item.id}/attachment`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ▧{" "}
                    <span>{item.attachmentFileName ?? "Open attachment"}</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
        <ManagedTicketActions
          ticketId={ticket.id}
          status={ticket.status}
          priority={ticket.priority}
        />
      </section>
    </WorkspaceShell>
  );
}
