import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { getManagedOrder, getManagedOrders } from "@/features/commerce/service";
import { RefundForm } from "@/features/commerce/ui/refund-form";
import { AdminModal } from "@/components/admin-modal";
import { normaliseProductName } from "@/features/catalog/presentation";
import { UiIcon } from "@/components/ui-icon";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  adminCard,
  adminControl,
  adminDetailBackdrop,
  adminDetailHeader,
  adminDetailList,
  adminEmptyState,
  adminFilterForm,
  adminMiniRecord,
  adminPagination,
  adminPrimaryButton,
  adminResponsiveTable,
  adminSecondaryButton,
  adminSideDetail,
  adminSideSection,
  adminStatusClass,
  adminStatusPill,
} from "@/components/admin-styles";

type ManagedOrder = {
  id: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  couponCode: string | null;
  createdAt: Date;
  studentName: string;
  email: string;
  products: string;
  paymentId: string | null;
  paymentStatus: string | null;
  paymentAmountPaise: number | null;
  refundedPaise: number;
};
type Detail = ManagedOrder & {
  paidAt: Date | null;
  provider: string | null;
  providerPaymentId: string | null;
  items: {
    productId: string;
    name: string;
    pricePaise: number;
    accessDays: number;
  }[];
};
export const metadata = { title: "Orders" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    order?: string;
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const auth = await requireWorkspace(true);
  const query = await searchParams;
  const orders = (await getManagedOrders()) as ManagedOrder[];
  const q = query.q?.trim().toLowerCase() ?? "";
  const status = query.status ?? "all";
  const from = query.from ? new Date(`${query.from}T00:00:00`) : null;
  const to = query.to ? new Date(`${query.to}T23:59:59.999`) : null;
  const filtered = orders.filter(
    (order) =>
      (!q ||
        `${order.studentName} ${order.email} ${order.products} ${order.id}`
          .toLowerCase()
          .includes(q)) &&
      (status === "all" || order.status === status) &&
      (!from || new Date(order.createdAt) >= from) &&
      (!to || new Date(order.createdAt) <= to),
  );
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, Number(query.page) || 1), totalPages);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = query.order
    ? ((await getManagedOrder(query.order).catch(() => null)) as Detail | null)
    : null;
  const keep = new URLSearchParams();
  if (q) keep.set("q", query.q ?? "");
  if (status !== "all") keep.set("status", status);
  if (query.from) keep.set("from", query.from);
  if (query.to) keep.set("to", query.to);
  if (page > 1) keep.set("page", String(page));
  const pageHref = (pageValue: number) => {
    const params = new URLSearchParams(keep);
    if (pageValue > 1) params.set("page", String(pageValue));
    else params.delete("page");
    const suffix = params.toString();
    return `/admin/orders${suffix ? `?${suffix}` : ""}`;
  };
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="orders"
    >
      <AdminPageHeader
        title="Orders & Payments"
        description="View and manage student orders, payments and receipts."
      />
      <form
        className={`${adminFilterForm} grid-cols-[minmax(8.5rem,0.48fr)_minmax(8.5rem,0.48fr)_minmax(11rem,0.65fr)_minmax(15rem,1.15fr)_auto] max-[1050px]:grid-cols-2 max-[700px]:grid-cols-1`}
      >
        <label>
          <span>From</span>
          <input
            className={adminControl}
            type="date"
            name="from"
            defaultValue={query.from}
          />
        </label>
        <label>
          <span>To</span>
          <input
            className={adminControl}
            type="date"
            name="to"
            defaultValue={query.to}
          />
        </label>
        <label>
          <span>Payment status</span>
          <select className={adminControl} name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_REFUNDED">Partially refunded</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          <span>Search</span>
          <input
            className={adminControl}
            name="q"
            defaultValue={query.q}
            placeholder="Order ID, student or package"
          />
        </label>
        <button className={adminPrimaryButton}>Search</button>
      </form>
      <section className={adminCard}>
        <div className="overflow-x-auto max-[800px]:overflow-visible">
          <table
            className={`${adminResponsiveTable} min-w-[980px] max-[700px]:min-w-0`}
          >
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Student</th>
                <th>Packages</th>
                <th>Base amount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Payment status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr
                  className={selected?.id === order.id ? "bg-[#fff2e9]" : ""}
                  key={order.id}
                >
                  <td data-label="Order ID">
                    <strong>#{order.id.slice(0, 10).toUpperCase()}</strong>
                  </td>
                  <td data-label="Student">
                    <strong>{order.studentName}</strong>
                    <small>{order.email}</small>
                  </td>
                  <td data-label="Packages">
                    {normaliseProductName(order.products)}
                  </td>
                  <td data-label="Base amount">
                    {formatMoney(
                      Math.max(0, order.subtotalPaise - order.discountPaise),
                      order.currency,
                    )}
                  </td>
                  <td data-label="Tax">
                    {order.taxPaise > 0
                      ? formatMoney(order.taxPaise, order.currency)
                      : "—"}
                  </td>
                  <td data-label="Total">
                    <strong>
                      {formatMoney(order.totalPaise, order.currency)}
                    </strong>
                  </td>
                  <td data-label="Payment status">
                    <span
                      className={`${adminStatusPill} ${adminStatusClass(order.status)}`}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td data-label="Date">
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td data-label="Actions">
                    <Link
                      className="font-bold text-prep-orange-dark hover:underline"
                      href={`/admin/orders?${keep.toString()}${keep.size ? "&" : ""}order=${order.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className={adminEmptyState}>
            <strong>No orders found</strong>
            <span>Try another search or filter.</span>
          </div>
        )}
        <footer className={adminPagination}>
          <span>
            Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
            orders
          </span>
          {totalPages > 1 ? (
            <nav aria-label="Order pages">
              <Link
                aria-disabled={page === 1}
                href={pageHref(Math.max(1, page - 1))}
              >
                ‹
              </Link>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (value) =>
                    value === 1 ||
                    value === totalPages ||
                    Math.abs(value - page) <= 1,
                )
                .map((value) => (
                  <Link
                    aria-current={value === page ? "page" : undefined}
                    href={pageHref(value)}
                    key={value}
                  >
                    {value}
                  </Link>
                ))}
              <Link
                aria-disabled={page === totalPages}
                href={pageHref(Math.min(totalPages, page + 1))}
              >
                ›
              </Link>
            </nav>
          ) : null}
        </footer>
      </section>
      {selected && (
        <>
          <Link
            className={adminDetailBackdrop}
            href={`/admin/orders${keep.size ? `?${keep.toString()}` : ""}`}
            aria-label="Close order details"
          />
          <section
            className={adminSideDetail}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
          >
            <header
              className={`${adminDetailHeader} grid grid-cols-[1fr_auto_auto]`}
            >
              <div>
                <h2 id="order-detail-title">
                  Order #{selected.id.slice(0, 10).toUpperCase()}
                </h2>
              </div>
              <span
                className={`${adminStatusPill} ${adminStatusClass(selected.status)}`}
              >
                {selected.status.replaceAll("_", " ")}
              </span>
              <Link
                className="grid size-[2.35rem] place-items-center rounded-[0.55rem] border border-[#dedbd7] bg-white text-[#535a60] hover:bg-[#f6f5f3] [&_svg]:size-5"
                href={`/admin/orders${keep.size ? `?${keep.toString()}` : ""}`}
                aria-label="Close"
              >
                <UiIcon name="close" />
              </Link>
            </header>
            <div className={adminSideSection}>
              <h3>Student details</h3>
              <div className="flex items-center gap-[0.65rem]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef2fb] text-xs font-bold text-[#46649a]">
                  {selected.studentName.slice(0, 1)}
                </span>
                <p className="m-0 grid text-[0.76rem]">
                  <strong className="block">{selected.studentName}</strong>
                  <small className="block text-prep-muted">
                    {selected.email}
                  </small>
                </p>
              </div>
            </div>
            <div className={adminSideSection}>
              <h3>Order items</h3>
              {selected.items.map((item) => (
                <article className={adminMiniRecord} key={item.productId}>
                  <div>
                    <strong>{normaliseProductName(item.name)}</strong>
                    <small>{item.accessDays} days access</small>
                  </div>
                  <b>{formatMoney(item.pricePaise, selected.currency)}</b>
                </article>
              ))}
            </div>
            <div className={adminSideSection}>
              <h3>Price breakdown</h3>
              <dl className={adminDetailList}>
                <div>
                  <dt>Base amount</dt>
                  <dd>
                    {formatMoney(selected.subtotalPaise, selected.currency)}
                  </dd>
                </div>
                {selected.discountPaise > 0 ? (
                  <div>
                    <dt>
                      Coupon{" "}
                      {selected.couponCode ? `(${selected.couponCode})` : ""}
                    </dt>
                    <dd>
                      − {formatMoney(selected.discountPaise, selected.currency)}
                    </dd>
                  </div>
                ) : null}
                {selected.taxPaise > 0 ? (
                  <div>
                    <dt>Tax recorded</dt>
                    <dd>{formatMoney(selected.taxPaise, selected.currency)}</dd>
                  </div>
                ) : null}
                <div className="border-t border-prep-line pt-2 text-[0.82rem] font-bold">
                  <dt>Total amount</dt>
                  <dd>{formatMoney(selected.totalPaise, selected.currency)}</dd>
                </div>
              </dl>
            </div>
            <div className={adminSideSection}>
              <h3>
                Payment details{" "}
                {selected.provider ? `(${selected.provider})` : ""}
              </h3>
              <dl className={adminDetailList}>
                <div>
                  <dt>Provider payment ID</dt>
                  <dd>{selected.providerPaymentId ?? "—"}</dd>
                </div>
                <div>
                  <dt>Payment status</dt>
                  <dd>{selected.paymentStatus ?? "Not started"}</dd>
                </div>
                <div>
                  <dt>Payment date</dt>
                  <dd>
                    {selected.paidAt
                      ? new Date(selected.paidAt).toLocaleString("en-IN")
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Refunded</dt>
                  <dd>
                    {formatMoney(selected.refundedPaise, selected.currency)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-[0.65rem] max-[700px]:grid-cols-1 [&>*]:w-full">
                <Link
                  className={adminSecondaryButton}
                  href={`/invoice/${selected.id}`}
                >
                  Download receipt
                </Link>
                {selected.paymentId &&
                Math.max(
                  0,
                  (selected.paymentAmountPaise ?? 0) - selected.refundedPaise,
                ) > 0 ? (
                  <AdminModal
                    secondary
                    label="Process refund"
                    title="Process refund"
                    description="Choose a refund amount and whether package access should be revoked."
                  >
                    <RefundForm
                      paymentId={selected.paymentId}
                      maxPaise={Math.max(
                        0,
                        (selected.paymentAmountPaise ?? 0) -
                          selected.refundedPaise,
                      )}
                    />
                  </AdminModal>
                ) : null}
              </div>
            </div>
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}
