import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { AdminModal } from "@/components/admin-modal";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import {
  getManagedNotificationDeliveries,
  getNotificationCampaignOptions,
  getNotificationCampaigns,
} from "@/features/operations/service";
import {
  NotificationCampaignForm,
  RetryDeliveryButton,
} from "@/features/operations/ui/admin-actions";
import {
  adminCard,
  adminCardVisible,
  adminEmptyState,
  adminPagination,
  adminPrimaryButton,
  adminResponsiveTable,
  adminSecondaryButton,
  adminStatusClass,
  adminStatusPill,
} from "@/components/admin-styles";

export const metadata = { title: "Notifications" };
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
function ChannelIcon({ channel }: { channel: string }) {
  return channel === "EMAIL" ? (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  );
}
const audienceLabel = (audience: string, product: string | null) =>
  audience === "PACKAGE_CUSTOMERS"
    ? `${product ?? "Package"} customers`
    : audience === "INACTIVE_STUDENTS"
      ? "Inactive students"
      : "All students";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; audience?: string; page?: string }>;
}) {
  const auth = await requireWorkspacePermission(
    OPERATIONS_PERMISSIONS.manageNotifications,
  );
  const [campaigns, products, deliveries] = await Promise.all([
    getNotificationCampaigns(),
    getNotificationCampaignOptions(),
    getManagedNotificationDeliveries(),
  ]);
  const query = await searchParams;
  const q = query.q?.trim().toLowerCase() ?? "";
  const audience = query.audience ?? "ALL";
  const visible = campaigns.filter(
    (item) =>
      (!q ||
        `${item.title} ${item.body} ${item.productName ?? ""}`
          .toLowerCase()
          .includes(q)) &&
      (audience === "ALL" || item.audience === audience),
  );
  const failed = deliveries.filter((item) => item.status !== "SENT");
  const pageSize = 10;
  const page = Math.max(1, Number(query.page) || 1);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = visible.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const pageHref = (value: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (audience !== "ALL") params.set("audience", audience);
    if (value > 1) params.set("page", String(value));
    const suffix = params.toString();
    return `/admin/notifications${suffix ? `?${suffix}` : ""}`;
  };
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="notifications"
    >
      <AdminPageHeader
        title="Notifications"
        description="Send announcements to students and review notification delivery."
      >
        <AdminModal
          label="Send notification"
          title="Send notification"
          icon="send"
        >
          <NotificationCampaignForm products={products} />
        </AdminModal>
      </AdminPageHeader>
      <section className={adminCardVisible}>
        <div className="relative flex items-center gap-[0.65rem] border-b border-[#e7e5e2] px-4 py-[0.9rem] max-[800px]:flex-wrap max-[800px]:items-stretch">
          <form
            className="relative flex w-full max-w-[30rem] items-center max-[800px]:flex-1 max-[460px]:basis-full"
            role="search"
          >
            <span className="pointer-events-none absolute left-[0.8rem] size-4 text-[#7e858b] [&_svg]:size-full">
              <SearchIcon />
            </span>
            <input
              className="h-[2.7rem] w-full rounded-[0.45rem] border border-[#dcdde0] bg-white py-[0.55rem] pr-[0.8rem] pl-[2.35rem] outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]"
              name="q"
              defaultValue={query.q}
              type="search"
              aria-label="Search notifications"
              placeholder="Search notifications…"
            />
            {audience !== "ALL" ? (
              <input name="audience" type="hidden" value={audience} />
            ) : null}
            <button className="sr-only" type="submit">
              Search
            </button>
          </form>
          <details className="group relative z-[8]">
            <summary className="flex h-[2.7rem] cursor-pointer list-none items-center gap-[0.45rem] rounded-[0.45rem] border border-[#dcdde0] bg-white px-[0.85rem] text-[0.82rem] font-bold text-[#42484d] group-open:border-prep-orange group-open:text-prep-orange-dark group-open:ring-2 group-open:ring-[#ffdfd2] [&::-webkit-details-marker]:hidden [&_svg]:size-4">
              <FilterIcon /> Filters
              {audience !== "ALL" ? (
                <b className="grid size-[1.15rem] place-items-center rounded-full bg-prep-orange text-[0.62rem] text-white">
                  1
                </b>
              ) : null}
            </summary>
            <form className="absolute top-[calc(100%+0.45rem)] right-0 grid w-[17rem] gap-[0.8rem] rounded-[0.55rem] border border-[#dedbd7] bg-white p-4 shadow-[0_1rem_2.6rem_rgba(33,28,24,0.16)] max-[800px]:w-[min(17rem,calc(100vw-2rem))]">
              {query.q ? (
                <input name="q" type="hidden" value={query.q} />
              ) : null}
              <label className="grid gap-[0.35rem]">
                <span className="text-[0.74rem] font-bold text-[#596168]">
                  Audience
                </span>
                <select
                  className="h-[2.65rem] w-full rounded-prep-control border border-prep-line bg-white px-3"
                  name="audience"
                  defaultValue={audience}
                >
                  <option value="ALL">All audiences</option>
                  <option value="ALL_STUDENTS">All students</option>
                  <option value="PACKAGE_CUSTOMERS">Package customers</option>
                  <option value="INACTIVE_STUDENTS">Inactive students</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-[0.55rem]">
                <Link
                  className={adminSecondaryButton}
                  href="/admin/notifications"
                >
                  Clear
                </Link>
                <button className={adminPrimaryButton} type="submit">
                  Apply
                </button>
              </div>
            </form>
          </details>
          <span className="ml-auto text-[0.76rem] font-semibold whitespace-nowrap text-prep-muted max-[800px]:w-full max-[800px]:ml-0 max-[460px]:w-auto max-[460px]:self-center max-[460px]:ml-auto">
            {visible.length} notification{visible.length === 1 ? "" : "s"}
          </span>
        </div>
        {visible.length ? (
          <>
            <div className="overflow-x-auto max-[800px]:overflow-visible">
              <table
                className={`${adminResponsiveTable} min-w-[850px] max-[800px]:min-w-0 [&_th:first-child]:pl-[1.15rem] [&_td:first-child]:pl-[1.15rem] [&_th:last-child]:pr-[1.15rem] [&_td:last-child]:pr-[1.15rem]`}
              >
                <thead>
                  <tr>
                    <th>Audience</th>
                    <th>Title</th>
                    <th>Channel</th>
                    <th>Recipients</th>
                    <th>Sent date</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Audience">
                        <span className="font-semibold text-[#343a3f]">
                          {audienceLabel(item.audience, item.productName)}
                        </span>
                      </td>
                      <td data-label="Notification">
                        <strong className="block font-bold text-[#252a2e]">
                          {item.title}
                        </strong>
                        <small className="mt-[0.2rem] block max-w-[28rem] overflow-hidden text-ellipsis whitespace-nowrap text-prep-muted max-[800px]:max-w-none max-[800px]:whitespace-normal">
                          {item.body}
                        </small>
                      </td>
                      <td data-label="Channel">
                        <span
                          className={`inline-flex items-center gap-[0.35rem] rounded-full px-[0.55rem] py-[0.32rem] text-[0.72rem] font-bold whitespace-nowrap [&_svg]:size-[0.9rem] ${item.channel === "EMAIL" ? "bg-[#fff0e8] text-prep-orange-dark" : "bg-[#eef4ff] text-[#42649a]"}`}
                        >
                          <ChannelIcon channel={item.channel} />
                          {item.channel === "IN_APP" ? "In-app" : "Email"}
                        </span>
                      </td>
                      <td data-label="Recipients">
                        <strong className="tabular-nums">
                          {item.recipientCount.toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td
                        data-label="Sent date"
                        className="whitespace-nowrap [&_small]:mt-[0.15rem] [&_small]:block [&_small]:text-prep-muted [&_strong]:block"
                      >
                        <strong>
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-IN",
                            { dateStyle: "medium" },
                          )}
                        </strong>
                        <small>
                          {new Date(item.createdAt).toLocaleTimeString(
                            "en-IN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </small>
                      </td>
                      <td data-label="Actions">
                        <details className="group relative max-[800px]:justify-self-start">
                          <summary
                            className="grid size-8 cursor-pointer list-none place-items-center rounded-[0.4rem] text-[1.15rem] font-extrabold text-[#5f666c] hover:bg-[#fff0e8] hover:text-prep-orange-dark group-open:bg-[#fff0e8] group-open:text-prep-orange-dark [&::-webkit-details-marker]:hidden"
                            aria-label={`View details for ${item.title}`}
                          >
                            ⋮
                          </summary>
                          <div className="absolute top-[calc(100%+0.35rem)] right-0 z-30 grid w-[min(21rem,calc(100vw-3rem))] gap-[0.35rem] border border-[#dedbd7] bg-white p-[0.9rem] whitespace-normal shadow-[0_1rem_2.6rem_rgba(33,28,24,0.16)] max-[800px]:fixed max-[800px]:right-4 max-[800px]:bottom-4 max-[800px]:left-4 max-[800px]:top-auto max-[800px]:w-auto [&_p]:m-0 [&_p]:text-[0.72rem] [&_p]:leading-[1.5] [&_p]:text-[#5f666c] [&_small]:text-[0.65rem] [&_small]:text-prep-muted [&_strong]:text-[0.8rem] [&_strong]:text-[#25292d]">
                            <strong>{item.title}</strong>
                            <p>{item.body}</p>
                            <small>
                              {audienceLabel(item.audience, item.productName)} ·{" "}
                              {item.recipientCount} recipients
                            </small>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className={adminPagination}>
              <span>
                Showing {visible.length ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, visible.length)} of{" "}
                {visible.length}
              </span>
              {totalPages > 1 ? (
                <nav aria-label="Notification pages">
                  <Link
                    aria-disabled={currentPage === 1}
                    href={pageHref(Math.max(1, currentPage - 1))}
                  >
                    ‹
                  </Link>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (value) =>
                        value === 1 ||
                        value === totalPages ||
                        Math.abs(value - currentPage) <= 1,
                    )
                    .map((value) => (
                      <Link
                        aria-current={
                          value === currentPage ? "page" : undefined
                        }
                        href={pageHref(value)}
                        key={value}
                      >
                        {value}
                      </Link>
                    ))}
                  <Link
                    aria-disabled={currentPage === totalPages}
                    href={pageHref(Math.min(totalPages, currentPage + 1))}
                  >
                    ›
                  </Link>
                </nav>
              ) : null}
            </footer>
          </>
        ) : (
          <div className={adminEmptyState}>
            <strong>No notifications found</strong>
            <span>Send a notification or change the filters.</span>
          </div>
        )}
      </section>
      {failed.length > 0 && (
        <section className={`${adminCard} mt-4 p-4`}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="eyebrow">NEEDS ATTENTION</span>
              <h2>Email delivery issues</h2>
            </div>
          </div>
          {failed.slice(0, 12).map((item) => (
            <article
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-prep-line py-[0.85rem] max-[650px]:grid-cols-1"
              key={item.id}
            >
              <div className="grid gap-1">
                <strong>{item.title}</strong>
                <small className="text-prep-muted">
                  {item.name} · {item.email}
                  {item.lastError ? ` · ${item.lastError}` : ""}
                </small>
              </div>
              <span
                className={`${adminStatusPill} ${adminStatusClass(item.status)}`}
              >
                {item.status}
              </span>
              <RetryDeliveryButton id={item.id} />
            </article>
          ))}
        </section>
      )}
    </WorkspaceShell>
  );
}
