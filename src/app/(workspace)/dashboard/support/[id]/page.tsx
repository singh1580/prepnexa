import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentSupportTicket } from "@/features/operations/service";
import { SupportReplyForm } from "@/features/operations/ui/student-actions";
import { AppError } from "@/lib/errors/app-error";
import { PrepstoreIcon } from "@/components/brand";
import { SupportLiveRefresh } from "@/features/operations/ui/support-live-refresh";

export const metadata = { title: "Support ticket" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  let ticket: Awaited<ReturnType<typeof getStudentSupportTicket>>;
  try {
    ticket = await getStudentSupportTicket((await params).id, auth.user.id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="support"
    >
      <SupportLiveRefresh revision={ticket.messages.at(-1)?.id ?? "empty"} />
      <nav
        className="mb-3 flex max-w-full flex-wrap items-center gap-x-[.45rem] gap-y-[.32rem] text-[.68rem] leading-[1.35] text-[#7c8287] [&_a:hover]:text-prep-orange"
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <Link href="/dashboard/support">Support</Link>
        <span aria-hidden="true">›</span>
        <b className="min-w-0 max-w-full break-words whitespace-normal text-[#44494e]">
          Ticket #{String(ticket.id).slice(0, 8).toUpperCase()}
        </b>
      </nav>
      <Link
        className="inline-flex font-bold text-[#c84114] hover:text-[#a83410]"
        href="/dashboard/support"
      >
        ← Back to Support
      </Link>
      <section className="mt-3 overflow-hidden rounded-[.6rem] border border-[#dedede] bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)] max-[700px]:overflow-visible max-[700px]:rounded-none max-[700px]:border-0 max-[700px]:shadow-none">
        <header className="flex items-center justify-between gap-4 border-b border-[#e7e5e2] px-[1.2rem] py-[1.05rem] max-[700px]:gap-[.8rem] max-[700px]:px-0 max-[700px]:pt-1 max-[700px]:pb-[.9rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 max-[700px]:gap-2">
              <h1 className="m-0 text-[1.2rem] tracking-[-.02em] break-words">
                Ticket #{String(ticket.id).slice(0, 8).toUpperCase()}
              </h1>
              <span
                className={`inline-flex rounded-[.3rem] px-2 py-[.28rem] text-[.68rem] font-bold capitalize ${
                  ticket.status === "RESOLVED"
                    ? "bg-[#e2f5e9] text-[#177541]"
                    : ticket.status === "CLOSED"
                      ? "bg-[#efefee] text-[#60666b]"
                      : "bg-[#edf2ff] text-[#3b69bb]"
                }`}
              >
                ● {String(ticket.status).replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-[.45rem] mb-0 flex flex-wrap items-center gap-x-[.7rem] gap-y-[.3rem] text-xs text-[#747b80] max-[380px]:items-start">
              <span>
                Created{" "}
                {new Date(ticket.createdAt as Date).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span className="border-l border-[#e6e2de] pl-[.7rem] font-semibold text-[#555d63] max-[380px]:w-full max-[380px]:border-l-0 max-[380px]:pl-0">
                {String(ticket.category).replaceAll("_", " ")}
              </span>
            </p>
          </div>
        </header>
        <div
          className="grid gap-0 px-[1.2rem] py-[.35rem] max-[700px]:px-0 max-[700px]:py-1"
          data-support-thread="true"
        >
          {ticket.messages.map((item) => (
            <article
              className="grid w-full grid-cols-[2.75rem_minmax(0,1fr)] gap-[.8rem] border-0 bg-transparent py-[.9rem] not-first:border-t not-first:border-t-[#efedea] max-[700px]:grid-cols-[2.2rem_minmax(0,1fr)] max-[700px]:gap-[.6rem] max-[700px]:py-[.8rem]"
              key={item.id}
            >
              <i
                className={`grid size-[2.2rem] place-items-center self-start rounded-full text-[.68rem] not-italic max-[700px]:size-8 ${
                  item.mine
                    ? "bg-[#f1dfd1] font-bold text-[#675246]"
                    : "border border-[#eadfd8] bg-white p-[.35rem] text-[#e84916] [&_img]:block [&_img]:size-full [&_img]:object-contain"
                }`}
                aria-hidden="true"
              >
                {item.mine ? (
                  auth.user.name.slice(0, 2).toUpperCase()
                ) : (
                  <PrepstoreIcon className="block size-5 object-contain" />
                )}
              </i>
              <div className="min-w-0">
                <header className="flex flex-wrap items-center gap-x-[.7rem] gap-y-[.2rem] max-[700px]:items-baseline">
                  <strong className="text-[.8rem]">
                    {item.mine ? auth.user.name : "Prepstore Support"}
                  </strong>
                  <small className="text-[.68rem] text-prep-muted max-[700px]:ml-auto max-[380px]:ml-0 max-[380px]:w-full">
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                </header>
                <p
                  className={`mt-[.45rem] mb-0 w-fit max-w-[min(46rem,92%)] whitespace-pre-wrap rounded-[.55rem] px-[.8rem] py-[.68rem] text-[.8rem] leading-[1.55] text-[#353b40] max-[700px]:max-w-full ${item.mine ? "bg-[#f5f5f3]" : "bg-[#fff1ea]"}`}
                >
                  {item.body}
                </p>
                {item.attachmentObjectKey && (
                  <a
                    className="mt-[.7rem] inline-flex items-center gap-[.45rem] rounded-[.35rem] border border-[#dedfe1] bg-[#f7f7f6] px-3 py-[.6rem] text-[.7rem] font-semibold text-[#b5421c] hover:border-[#b5421c]"
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
        </div>
        {ticket.status === "CLOSED" || ticket.status === "RESOLVED" ? (
          <p className="m-0 border-t border-[#e5e3df] bg-[#f8faf9] px-[1.2rem] py-4 text-[.78rem] leading-relaxed text-[#49705b]">
            This ticket is {String(ticket.status).toLowerCase()}. Create a new
            ticket if you need more help.
          </p>
        ) : (
          <section className="border-t border-[#e3e1de] bg-[#fcfbf9] px-4 pt-[.85rem] pb-4 max-[700px]:mx-[-.1rem] max-[700px]:bg-transparent max-[700px]:px-0 max-[700px]:pt-[.8rem] max-[700px]:pb-0">
            <SupportReplyForm ticketId={String(ticket.id)} />
          </section>
        )}
      </section>
    </WorkspaceShell>
  );
}
