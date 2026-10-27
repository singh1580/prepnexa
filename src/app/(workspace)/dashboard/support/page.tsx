import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminModal } from "@/components/admin-modal";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentOrders } from "@/features/commerce/service";
import {
  getStudentNotifications,
  getStudentSupportTickets,
} from "@/features/operations/service";
import { NewSupportTicketForm } from "@/features/operations/ui/student-actions";
import { adminStatusClass, adminStatusPill } from "@/components/admin-styles";

export const metadata = { title: "Support centre" };
function SupportIcon({
  name,
}: {
  name: "search" | "payment" | "access" | "account" | "technical";
}) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    payment: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
    access: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 13.5a7.4 7.4 0 0 0 0-3l2-1.5-2-3.5-2.5 1A7 7 0 0 0 14 5l-.5-3h-4L9 5a7 7 0 0 0-2.5 1.5l-2.5-1L2 9l2 1.5a7.4 7.4 0 0 0 0 3L2 15l2 3.5 2.5-1A7 7 0 0 0 9 19l.5 3h4l.5-3a7 7 0 0 0 2.5-1.5l2.5 1 2-3.5z" />
      </>
    ),
    technical: (
      <>
        <path d="M14 6 6 14M16 4a4 4 0 0 0 4 4l-8 8-4-4z" />
        <path d="m5 15-2 2 4 4 2-2" />
      </>
    ),
  };
  return (
    <svg
      className="size-[1.15rem]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const query = (await searchParams).q?.trim() ?? "";
  const [tickets, orders, notifications] = await Promise.all([
    getStudentSupportTickets(auth.user.id),
    getStudentOrders(auth.user.id),
    getStudentNotifications(auth.user.id),
  ]);
  const orderOptions = orders.map((order) => {
    const value = order as {
      id: string;
      createdAt: Date;
      items: { name: string }[];
    };
    return {
      id: value.id,
      label: `${value.items.map((item) => item.name).join(", ")} · ${new Date(value.createdAt).toLocaleDateString("en-IN")}`,
    };
  });
  const normalized = query.toLowerCase();
  const visible = normalized
    ? tickets.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(normalized) ||
          ticket.category.toLowerCase().includes(normalized) ||
          ticket.status.toLowerCase().includes(normalized),
      )
    : tickets;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="support"
      unreadNotifications={notifications.unreadCount}
    >
      <header className="mb-[1.1rem] flex items-center gap-5">
        <div className="min-w-0">
          <h1 className="mt-0 mb-[.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-.04em] break-words">
            Support Centre
          </h1>
          <p className="m-0 max-w-3xl text-[.88rem] text-[#687077]">
            Find answers, explore helpful resources or raise a ticket.
          </p>
        </div>
      </header>
      <section className="rounded-[.55rem] bg-[#fff7f1] p-[1.4rem] text-center">
        <h2 className="m-0 text-xl">How can we help?</h2>
        <p className="mt-[.3rem] mb-4 text-xs text-prep-muted">
          Search our help centre for quick answers.
        </p>
        <form
          className="relative mx-auto grid w-full max-w-2xl grid-cols-[auto_1fr_auto] items-center gap-[.65rem] rounded-[.55rem] border border-[#e2e0dd] bg-white px-3 py-1 shadow-[0_.5rem_1.5rem_#65341910] max-[600px]:grid-cols-[auto_1fr]"
          role="search"
        >
          <SupportIcon name="search" />
          <input
            className="h-10 w-full border-0 bg-transparent text-[.85rem] outline-none"
            name="q"
            defaultValue={query}
            aria-label="Search support tickets and help topics"
            placeholder="Search payments, packages, access or technical issues…"
          />
          <button className="h-10 rounded-[.35rem] border-0 bg-prep-orange px-4 font-bold text-white max-[600px]:col-span-full max-[600px]:w-full">
            Search
          </button>
        </form>
      </section>
      <section className="mt-[1.4rem]">
        <div className="mb-[.8rem] flex items-center justify-between gap-4">
          <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
            Popular topics
          </h2>
          <Link
            className="text-[.8rem] font-bold text-prep-orange"
            href="/dashboard/support"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1 [&>a]:flex [&>a]:items-center [&>a]:gap-[.8rem] [&>a]:rounded-lg [&>a]:border [&>a]:border-[#e2e0dd] [&>a]:bg-white [&>a]:p-4 [&_span]:grid [&_span]:gap-1 [&_b]:text-[.82rem] [&_small]:text-[.72rem] [&_small]:text-prep-muted">
          <Link href="/dashboard/support?q=payment">
            <i className="grid size-[2.35rem] place-items-center rounded-[.4rem] bg-[#fff0e8] text-[#e84916]">
              <SupportIcon name="payment" />
            </i>
            <span>
              <b>Payments &amp; Orders</b>
              <small>Billing, receipts, payment issues</small>
            </span>
          </Link>
          <Link href="/dashboard/support?q=access">
            <i className="grid size-[2.35rem] place-items-center rounded-[.4rem] bg-[#eaf1ff] text-[#3777d5]">
              <SupportIcon name="access" />
            </i>
            <span>
              <b>Package Access</b>
              <small>How to access your purchased packages</small>
            </span>
          </Link>
          <Link href="/dashboard/support?q=account">
            <i className="grid size-[2.35rem] place-items-center rounded-[.4rem] bg-[#e7f7e9] text-[#31944d]">
              <SupportIcon name="account" />
            </i>
            <span>
              <b>Account &amp; Settings</b>
              <small>Profile, security, login issues</small>
            </span>
          </Link>
          <Link href="/dashboard/support?q=technical">
            <i className="grid size-[2.35rem] place-items-center rounded-[.4rem] bg-[#eaf1ff] text-[#3777d5]">
              <SupportIcon name="technical" />
            </i>
            <span>
              <b>Technical Issues</b>
              <small>Video, quizzes and other help</small>
            </span>
          </Link>
        </div>
      </section>
      <section className="mt-6 border-t border-[#e7e5e2] pt-5">
        <div className="mb-[.8rem] flex items-center justify-between gap-4 max-[600px]:items-stretch max-[600px]:flex-col">
          <h2 className="m-0 text-[1.22rem] tracking-[-.02em] text-[#24282b]">
            Your Support Tickets
          </h2>
          <AdminModal
            label="＋ Create new ticket"
            title="Create support ticket"
            description="Tell us what happened and we will keep the conversation organised here."
          >
            <NewSupportTicketForm orders={orderOptions} />
          </AdminModal>
        </div>
        {visible.length ? (
          <div className="overflow-x-auto rounded-lg border border-[#e2e0dd]">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#f5f5f4] p-[.7rem] text-left text-[.68rem] text-[#62686e]">
                    Ticket ID
                  </th>
                  <th className="bg-[#f5f5f4] p-[.7rem] text-left text-[.68rem] text-[#62686e]">
                    Subject
                  </th>
                  <th className="bg-[#f5f5f4] p-[.7rem] text-left text-[.68rem] text-[#62686e]">
                    Status
                  </th>
                  <th className="bg-[#f5f5f4] p-[.7rem] text-left text-[.68rem] text-[#62686e]">
                    Last update
                  </th>
                  <th className="bg-[#f5f5f4] p-[.7rem] text-left text-[.68rem] text-[#62686e]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="border-b border-[#e9e7e4] p-3 text-[.72rem] text-[#4e555a]">
                      #{ticket.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="border-b border-[#e9e7e4] p-3 text-[.72rem] text-[#4e555a]">
                      {ticket.subject}
                    </td>
                    <td className="border-b border-[#e9e7e4] p-3 text-[.72rem] text-[#4e555a]">
                      <b
                        className={`${adminStatusPill} ${adminStatusClass(ticket.status)}`}
                      >
                        {ticket.status.replaceAll("_", " ")}
                      </b>
                    </td>
                    <td className="border-b border-[#e9e7e4] p-3 text-[.72rem] text-[#4e555a]">
                      {new Date(ticket.updatedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="border-b border-[#e9e7e4] p-3 text-[.72rem] text-[#4e555a]">
                      <Link
                        className="rounded-[.3rem] bg-[#fff0e9] px-[.6rem] py-[.35rem] font-bold text-prep-orange"
                        href={`/dashboard/support/${ticket.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#ddd8d3] p-8 text-center text-prep-muted">
            <h2>No support tickets found</h2>
            <p>
              {query
                ? "Try another search term."
                : "Create a ticket whenever you need help."}
            </p>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
