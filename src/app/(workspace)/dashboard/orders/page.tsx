import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { getStudentOrders } from "@/features/commerce/service";
import { getStudentNotifications } from "@/features/operations/service";

type Order = {
  id: string;
  status: string;
  totalPaise: number;
  currency: string;
  createdAt: Date;
  items: { name: string }[];
};
type Filter = "all" | "paid" | "pending" | "failed";
const group = (status: string): Exclude<Filter, "all"> =>
  status === "PAID"
    ? "paid"
    : ["CREATED", "PENDING"].includes(status)
      ? "pending"
      : "failed";
const statusClass = (status: Exclude<Filter, "all">) =>
  status === "paid"
    ? "bg-[#e2f5e9] text-[#177541]"
    : status === "pending"
      ? "bg-[#fff1d9] text-[#b36b0c]"
      : "bg-[#ffe6e4] text-[#cf312b]";
export const metadata = { title: "My orders" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const query = await searchParams;
  const selected = query.status;
  const filter: Filter =
    selected === "paid" || selected === "pending" || selected === "failed"
      ? selected
      : "all";
  const [raw, notifications] = await Promise.all([
    getStudentOrders(auth.user.id),
    getStudentNotifications(auth.user.id),
  ]);
  const orders = raw as unknown as Order[];
  const visible =
    filter === "all"
      ? orders
      : orders.filter((order) => group(order.status) === filter);
  const counts = {
    all: orders.length,
    paid: orders.filter((order) => group(order.status) === "paid").length,
    pending: orders.filter((order) => group(order.status) === "pending").length,
    failed: orders.filter((order) => group(order.status) === "failed").length,
  };
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="orders"
      unreadNotifications={notifications.unreadCount}
    >
      <header className="mb-[1.1rem]">
        <h1 className="mt-0 mb-[.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-.04em]">
          My Orders
        </h1>
        <p className="m-0 text-[.88rem] text-[#687077]">
          View your order history and download payment receipts.
        </p>
      </header>
      {query.notice === "checkout-unavailable" ? (
        <p
          className="mb-4 rounded-[.55rem] border border-[#e9c26d] bg-[#fff8e8] px-4 py-3 text-[.78rem] leading-relaxed text-[#77500d]"
          role="status"
        >
          That checkout is closed or expired. Review the order below, then start
          a fresh checkout if payment is still required.
        </p>
      ) : null}
      <section>
        <nav
          className="mb-3 flex gap-[.6rem] max-[700px]:grid max-[700px]:grid-cols-4 max-[700px]:gap-[.35rem]"
          aria-label="Filter orders"
        >
          {(["all", "paid", "pending", "failed"] as Filter[]).map((key) => (
            <Link
              className={`flex min-w-[5.8rem] items-center justify-center gap-[.4rem] rounded-full border px-[.8rem] py-[.55rem] text-[.75rem] font-semibold max-[700px]:min-w-0 max-[700px]:px-1 max-[700px]:text-[.68rem] max-[420px]:flex-col max-[420px]:gap-[.1rem] max-[420px]:leading-[1.15] ${
                filter === key
                  ? "border-prep-orange bg-prep-orange text-white"
                  : "border-[#dcdddf] bg-white text-[#555c62] hover:border-prep-orange hover:text-prep-orange"
              }`}
              href={
                key === "all"
                  ? "/dashboard/orders"
                  : `/dashboard/orders?status=${key}`
              }
              key={key}
            >
              {key[0].toUpperCase() + key.slice(1)}{" "}
              <b className="text-[.62rem]">{counts[key]}</b>
            </Link>
          ))}
        </nav>
        {visible.length ? (
          <div className="overflow-x-auto rounded-lg border border-[#e2e0dd] max-[700px]:overflow-visible max-[700px]:border-0 max-[700px]:bg-transparent">
            <table className="w-full min-w-[790px] border-collapse max-[700px]:block max-[700px]:min-w-0">
              <thead className="max-[700px]:hidden">
                <tr>
                  {[
                    "Order ID",
                    "Date",
                    "Packages",
                    "Total",
                    "Payment status",
                    "Actions",
                  ].map((label) => (
                    <th
                      className="bg-[#f5f5f4] p-3 text-left text-[.7rem] text-[#555c62]"
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="max-[700px]:grid max-[700px]:w-full max-[700px]:gap-3">
                {visible.map((order) => (
                  <tr
                    className="max-[700px]:block max-[700px]:w-full max-[700px]:overflow-hidden max-[700px]:rounded-[.55rem] max-[700px]:border max-[700px]:border-[#e2e0dd] max-[700px]:bg-white"
                    key={order.id}
                  >
                    <td
                      className="border-b border-[#ebe9e6] px-[.7rem] py-[.8rem] text-[.75rem] text-[#444b50] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-[minmax(6.8rem,38%)_minmax(0,1fr)] max-[700px]:items-start max-[700px]:gap-[.65rem] max-[700px]:px-3 max-[700px]:py-[.65rem] max-[700px]:text-right max-[420px]:grid-cols-[6.25rem_minmax(0,1fr)] max-[420px]:p-[.62rem] max-[700px]:before:text-left max-[700px]:before:text-[.68rem] max-[700px]:before:font-semibold max-[700px]:before:text-prep-muted max-[700px]:before:content-[attr(data-label)]"
                      data-label="Order ID"
                    >
                      <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                    </td>
                    <td
                      className="border-b border-[#ebe9e6] px-[.7rem] py-[.8rem] text-[.75rem] text-[#444b50] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-[minmax(6.8rem,38%)_minmax(0,1fr)] max-[700px]:items-start max-[700px]:gap-[.65rem] max-[700px]:px-3 max-[700px]:py-[.65rem] max-[700px]:text-right max-[420px]:grid-cols-[6.25rem_minmax(0,1fr)] max-[420px]:p-[.62rem] max-[700px]:before:text-left max-[700px]:before:text-[.68rem] max-[700px]:before:font-semibold max-[700px]:before:text-prep-muted max-[700px]:before:content-[attr(data-label)]"
                      data-label="Date"
                    >
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      className="max-w-[19rem] border-b border-[#ebe9e6] px-[.7rem] py-[.8rem] text-[.75rem] text-[#444b50] max-[700px]:grid max-[700px]:w-full max-[700px]:max-w-none max-[700px]:grid-cols-[minmax(6.8rem,38%)_minmax(0,1fr)] max-[700px]:items-start max-[700px]:gap-[.65rem] max-[700px]:px-3 max-[700px]:py-[.65rem] max-[700px]:text-right max-[420px]:grid-cols-[6.25rem_minmax(0,1fr)] max-[420px]:p-[.62rem] max-[700px]:before:text-left max-[700px]:before:text-[.68rem] max-[700px]:before:font-semibold max-[700px]:before:text-prep-muted max-[700px]:before:content-[attr(data-label)]"
                      data-label="Packages"
                    >
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap max-[700px]:overflow-visible max-[700px]:break-words max-[700px]:whitespace-normal">
                        {order.items.map((item) => item.name).join(", ")}
                      </span>
                    </td>
                    <td
                      className="border-b border-[#ebe9e6] px-[.7rem] py-[.8rem] text-[.75rem] text-[#444b50] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-[minmax(6.8rem,38%)_minmax(0,1fr)] max-[700px]:items-start max-[700px]:gap-[.65rem] max-[700px]:px-3 max-[700px]:py-[.65rem] max-[700px]:text-right max-[420px]:grid-cols-[6.25rem_minmax(0,1fr)] max-[420px]:p-[.62rem] max-[700px]:before:text-left max-[700px]:before:text-[.68rem] max-[700px]:before:font-semibold max-[700px]:before:text-prep-muted max-[700px]:before:content-[attr(data-label)]"
                      data-label="Total"
                    >
                      <strong>
                        {formatMoney(order.totalPaise, order.currency)}
                      </strong>
                    </td>
                    <td
                      className="border-b border-[#ebe9e6] px-[.7rem] py-[.8rem] text-[.75rem] text-[#444b50] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-[minmax(6.8rem,38%)_minmax(0,1fr)] max-[700px]:items-start max-[700px]:gap-[.65rem] max-[700px]:px-3 max-[700px]:py-[.65rem] max-[700px]:text-right max-[420px]:grid-cols-[6.25rem_minmax(0,1fr)] max-[420px]:p-[.62rem] max-[700px]:before:text-left max-[700px]:before:text-[.68rem] max-[700px]:before:font-semibold max-[700px]:before:text-prep-muted max-[700px]:before:content-[attr(data-label)]"
                      data-label="Payment status"
                    >
                      <b
                        className={`inline-flex gap-[.35rem] rounded-[.3rem] px-2 py-[.3rem] text-[.65rem] max-[700px]:justify-self-end ${statusClass(group(order.status))}`}
                      >
                        ●{" "}
                        {group(order.status)[0].toUpperCase() +
                          group(order.status).slice(1)}
                      </b>
                    </td>
                    <td
                      className="px-[.7rem] py-[.8rem] text-[.75rem] text-[#444b50] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-[minmax(6.8rem,38%)_minmax(0,1fr)] max-[700px]:items-start max-[700px]:gap-[.65rem] max-[700px]:px-3 max-[700px]:py-[.65rem] max-[700px]:text-right max-[420px]:grid-cols-[6.25rem_minmax(0,1fr)] max-[420px]:p-[.62rem] max-[700px]:before:text-left max-[700px]:before:text-[.68rem] max-[700px]:before:font-semibold max-[700px]:before:text-prep-muted max-[700px]:before:content-[attr(data-label)]"
                      data-label="Actions"
                    >
                      <div className="flex gap-[.45rem] max-[700px]:flex-wrap max-[700px]:justify-self-end">
                        <Link
                          className="rounded-[.3rem] border border-[#ffad91] px-[.6rem] py-[.45rem] text-[.65rem] font-bold text-[#de4312] hover:bg-[#fff1ea]"
                          href={`/dashboard/orders/${order.id}`}
                        >
                          View order
                        </Link>
                        {order.status === "PAID" ? (
                          <Link
                            className="rounded-[.3rem] border border-[#d7d9db] px-[.6rem] py-[.45rem] text-[.65rem] font-bold text-[#596066] hover:bg-[#f5f5f4]"
                            href={`/invoice/${order.id}`}
                          >
                            Receipt
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="m-0 p-3 text-[.68rem] text-[#777d82] max-[700px]:px-0 max-[700px]:py-[.7rem]">
              Showing {visible.length} of {orders.length} orders
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d9d6d2] bg-white px-5 py-12 text-center">
            <h2 className="m-0 text-lg">
              No {filter === "all" ? "" : filter} orders found
            </h2>
            <p className="mt-2 mb-4 text-[.82rem] text-[#687077]">
              Your matching orders will appear here.
            </p>
            {filter === "all" ? (
              <Link
                className="inline-flex rounded-[.4rem] bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark"
                href="/packages"
              >
                Explore packages
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
