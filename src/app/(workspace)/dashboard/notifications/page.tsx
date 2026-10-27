import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import {
  NotificationActions,
  NotificationReadButton,
} from "@/features/operations/ui/student-actions";

export const metadata = { title: "Notifications" };
function NotificationIcon() {
  return (
    <svg
      className="size-[1.2rem]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const notifications = await getStudentNotifications(auth.user.id);
  const filter = (await searchParams).filter ?? "all";
  const items =
    filter === "unread"
      ? notifications.items.filter((item) => !item.readAt)
      : notifications.items;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="notifications"
      unreadNotifications={notifications.unreadCount}
    >
      <header className="mb-[1.1rem] flex items-end justify-between gap-5 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-[.8rem]">
        <div className="min-w-0">
          <h1 className="mt-0 mb-[.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-.04em] break-words">
            Notifications
          </h1>
          <p className="m-0 max-w-3xl text-[.88rem] text-[#687077]">
            Purchase, result, security and support updates appear here.
          </p>
        </div>
        <NotificationActions
          unreadIds={notifications.items
            .filter((item) => !item.readAt)
            .map((item) => item.id)}
        />
      </header>
      <nav className="mb-3 flex gap-4 border-b border-[#e5e3df]">
        <Link
          aria-current={filter === "all" ? "page" : undefined}
          className={`border-b-2 px-1 py-[.65rem] text-[.75rem] font-bold ${filter === "all" ? "border-prep-orange text-prep-orange" : "border-transparent text-prep-muted"}`}
          href="/dashboard/notifications"
        >
          All{" "}
          <b className="ml-1 inline-grid h-[1.3rem] min-w-[1.3rem] place-items-center rounded-full bg-[#f2f1ef] text-[.6rem]">
            {notifications.items.length}
          </b>
        </Link>
        <Link
          aria-current={filter === "unread" ? "page" : undefined}
          className={`border-b-2 px-1 py-[.65rem] text-[.75rem] font-bold ${filter === "unread" ? "border-prep-orange text-prep-orange" : "border-transparent text-prep-muted"}`}
          href="/dashboard/notifications?filter=unread"
        >
          Unread{" "}
          <b className="ml-1 inline-grid h-[1.3rem] min-w-[1.3rem] place-items-center rounded-full bg-[#f2f1ef] text-[.6rem]">
            {notifications.unreadCount}
          </b>
        </Link>
      </nav>
      {items.length ? (
        <div className="grid gap-[.65rem]">
          {items.map((item) => (
            <article
              className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-[.8rem] rounded-lg border border-[#e3e1de] bg-white p-4 max-[700px]:grid-cols-[2.25rem_minmax(0,1fr)] ${item.readAt ? "" : "border-l-[3px] border-l-[#e94b17] bg-[#fffaf7]"}`}
              key={item.id}
            >
              <i className="grid size-10 place-items-center rounded-[.45rem] bg-[#fff0e8] text-[#e94b17] max-[700px]:size-9">
                <NotificationIcon />
              </i>
              <div className="min-w-0">
                <span className="text-[.74rem] text-[#7e8489]">
                  {item.type.replaceAll("_", " ")}
                </span>
                <h2 className="my-[.2rem] text-base break-words">
                  {item.title}
                </h2>
                <p className="my-[.2rem] text-[.86rem] leading-[1.55] text-[#6d7077]">
                  {item.body}
                </p>
                <small className="text-[.74rem] text-[#7e8489]">
                  {new Date(item.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </small>
              </div>
              {item.readAt ? (
                <span className="inline-flex rounded-full bg-[#eff3f6] px-3 py-1.5 text-[.76rem] text-[#687c90] max-[700px]:col-start-2 max-[700px]:justify-self-start">
                  Read
                </span>
              ) : (
                <NotificationReadButton id={item.id} />
              )}
            </article>
          ))}
        </div>
      ) : (
        <section className="mt-4 rounded-xl border border-dashed border-[#d8d5d0] bg-white px-6 py-14 text-center [&_p]:mx-auto [&_p]:mt-2 [&_p]:max-w-[38rem] [&_p]:text-sm [&_p]:text-prep-muted">
          <h2>
            {filter === "unread"
              ? "You’re all caught up"
              : "No notifications yet"}
          </h2>
          <p>
            {filter === "unread"
              ? "There are no unread notifications."
              : "Important account and learning updates will appear here."}
          </p>
        </section>
      )}
    </WorkspaceShell>
  );
}
