import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { getManagedOrder, getManagedOrders } from "@/features/commerce/service";
import { RefundForm } from "@/features/commerce/ui/refund-form";
import { AdminModal } from "@/components/admin-modal";

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
  }>;
}) {
  const auth = await requireWorkspace(true);
  const query = await searchParams;
  const orders = (await getManagedOrders()) as ManagedOrder[];
  const q = query.q?.trim().toLowerCase() ?? "";
  const status = query.status ?? "all";
  const from = query.from ? new Date(`${query.from}T00:00:00`) : null;
  const to = query.to ? new Date(`${query.to}T23:59:59.999`) : null;
  const rows = orders.filter(
    (order) =>
      (!q ||
        `${order.studentName} ${order.email} ${order.products} ${order.id}`
          .toLowerCase()
          .includes(q)) &&
      (status === "all" || order.status === status) &&
      (!from || new Date(order.createdAt) >= from) &&
      (!to || new Date(order.createdAt) <= to),
  );
  const selected = query.order
    ? ((await getManagedOrder(query.order).catch(() => null)) as Detail | null)
    : null;
  const keep = new URLSearchParams();
  if (q) keep.set("q", query.q ?? "");
  if (status !== "all") keep.set("status", status);
  if (query.from) keep.set("from", query.from);
  if (query.to) keep.set("to", query.to);
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      permissions={auth.permissions}
      section="orders"
    >
      <header className="admin-page-header">
        <div>
          <h1>Orders &amp; Payments</h1>
          <p>View and manage student orders, payments and invoices.</p>
        </div>
      </header>
      <form className="admin-list-controls order-filters">
        <label>
          <span>From</span>
          <input type="date" name="from" defaultValue={query.from} />
        </label>
        <label>
          <span>To</span>
          <input type="date" name="to" defaultValue={query.to} />
        </label>
        <label>
          <span>Payment status</span>
          <select name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_REFUNDED">Partially refunded</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="order-search-field">
          <span>Search</span>
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Order ID, student or package"
          />
        </label>
        <button className="button">Search</button>
      </form>
      <section className="admin-card support-table-card reference-order-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Student</th>
                <th>Packages</th>
                <th>Base amount</th>
                <th>GST</th>
                <th>Total</th>
                <th>Payment status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr
                  className={selected?.id === order.id ? "selected-row" : ""}
                  key={order.id}
                >
                  <td>
                    <strong>#{order.id.slice(0, 10).toUpperCase()}</strong>
                  </td>
                  <td>
                    <strong>{order.studentName}</strong>
                    <small>{order.email}</small>
                  </td>
                  <td>{order.products}</td>
                  <td>
                    {formatMoney(
                      Math.max(0, order.subtotalPaise - order.discountPaise),
                      order.currency,
                    )}
                  </td>
                  <td>{formatMoney(order.taxPaise, order.currency)}</td>
                  <td>
                    <strong>
                      {formatMoney(order.totalPaise, order.currency)}
                    </strong>
                  </td>
                  <td>
                    <span
                      className={`commerce-status status-${order.status.toLowerCase()}`}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <Link
                      className="table-open-link"
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
          <div className="clean-empty">
            <strong>No orders found</strong>
            <span>Try another search or filter.</span>
          </div>
        )}
      </section>
      {selected && (
        <>
          <Link
            className="admin-detail-backdrop"
            href={`/admin/orders${keep.size ? `?${keep.toString()}` : ""}`}
            aria-label="Close order details"
          />
          <section className="admin-side-detail order-side-detail reference-order-detail">
            <header>
              <div>
                <h2>Order #{selected.id.slice(0, 10).toUpperCase()}</h2>
              </div>
              <span
                className={`commerce-status status-${selected.status.toLowerCase()}`}
              >
                {selected.status.replaceAll("_", " ")}
              </span>
              <Link
                className="icon-button"
                href={`/admin/orders${keep.size ? `?${keep.toString()}` : ""}`}
                aria-label="Close"
              >
                ×
              </Link>
            </header>
            <div className="side-detail-section student-order-person">
              <h3>Student details</h3>
              <div>
                <span className="avatar">
                  {selected.studentName.slice(0, 1)}
                </span>
                <p>
                  <strong>{selected.studentName}</strong>
                  <small>{selected.email}</small>
                </p>
              </div>
            </div>
            <div className="side-detail-section">
              <h3>Order items</h3>
              {selected.items.map((item) => (
                <article className="mini-record" key={item.productId}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.accessDays} days access</small>
                  </div>
                  <b>{formatMoney(item.pricePaise, selected.currency)}</b>
                </article>
              ))}
            </div>
            <div className="side-detail-section">
              <h3>Price breakdown</h3>
              <dl className="detail-list">
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
                <div>
                  <dt>GST (18%)</dt>
                  <dd>{formatMoney(selected.taxPaise, selected.currency)}</dd>
                </div>
                <div className="side-total">
                  <dt>Total amount</dt>
                  <dd>{formatMoney(selected.totalPaise, selected.currency)}</dd>
                </div>
              </dl>
            </div>
            <div className="side-detail-section">
              <h3>
                Payment details{" "}
                {selected.provider ? `(${selected.provider})` : ""}
              </h3>
              <dl className="detail-list">
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
              <div className="order-detail-actions">
                <Link
                  className="button secondary"
                  href={`/invoice/${selected.id}`}
                >
                  Download invoice
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
