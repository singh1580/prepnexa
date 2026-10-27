import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentOrder } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { formatMoney } from "@/features/commerce/pricing";
import { PrepstoreIcon } from "@/components/brand";

type Order = {
  id: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  couponCode: string | null;
  createdAt: Date;
  paidAt: Date | null;
  expiresAt: Date;
  checkoutUnexpired: boolean;
  provider: string | null;
  providerPaymentId: string | null;
  paymentStatus: string | null;
  paymentAttemptId: string | null;
  checkoutReference: string | null;
  paymentAttemptStatus: string | null;
  items: {
    productId: string;
    name: string;
    pricePaise: number;
    accessDays: number;
  }[];
};
export const metadata = { title: "Order details" };

function statusClass(status: string) {
  if (["PAID", "COMPLETED", "CAPTURED"].includes(status))
    return "border-[#bfe2cc] bg-[#e7f4ec] text-[#276448]";
  if (["CREATED", "PENDING", "PROCESSING", "AUTHORIZED"].includes(status))
    return "border-[#f1d79b] bg-[#fff4d9] text-[#8a5b13]";
  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(status))
    return "border-[#cdd8f1] bg-[#edf2ff] text-[#405f9d]";
  if (["FAILED", "REJECTED"].includes(status))
    return "border-[#efc1bd] bg-[#fdebea] text-[#ad3028]";
  return "border-[#d9dce0] bg-[#f0f1f2] text-[#5f666d]";
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = commerceIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const raw = await getStudentOrder(parsed.data, auth.user.id);
  if (!raw) notFound();
  const order = raw as unknown as Order;
  const paid = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(
    order.status,
  );
  const resumable =
    !paid &&
    ["CREATED", "PENDING"].includes(order.status) &&
    order.checkoutReference?.startsWith("/") &&
    order.checkoutUnexpired;
  return (
    <WorkspaceShell
      admin={false}
      name={auth.user.name}
      email={auth.user.email}
      section="orders"
    >
      <nav
        className="mb-3 flex max-w-full flex-wrap items-center gap-x-[.45rem] gap-y-[.32rem] text-[.68rem] leading-[1.35] text-[#7c8287] [&_a:hover]:text-prep-orange"
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <Link href="/dashboard/orders">My Orders</Link>
        <span aria-hidden="true">›</span>
        <b className="text-[#44494e]">Order Details</b>
      </nav>
      <Link
        className="inline-flex font-bold text-[#c84114] hover:text-[#a83410]"
        href="/dashboard/orders"
      >
        ← Back to My Orders
      </Link>
      <header className="my-[.9rem] grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 rounded-[.45rem] border border-[#e3e1de] p-4 max-[700px]:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h1 className="m-0 text-[1.1rem] break-words">
            Order #{order.id.slice(0, 12).toUpperCase()}
          </h1>
          <p className="mt-1 mb-0 text-[.7rem] text-[#747b80]">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[.65rem] font-bold ${statusClass(order.status)}`}
        >
          ● {order.status.replaceAll("_", " ")}
        </span>
        {paid ? (
          <Link
            className="inline-flex min-h-[2.35rem] items-center justify-center rounded-[.4rem] border border-[#d2d5d7] bg-white px-[.8rem] py-2 text-[.7rem] font-bold text-[#3f474d] hover:bg-[#f5f5f4] max-[700px]:col-span-full max-[700px]:w-full"
            href={`/invoice/${order.id}`}
          >
            ⇩ Download Receipt
          </Link>
        ) : resumable ? (
          <Link
            className="inline-flex min-h-[2.35rem] items-center justify-center rounded-[.4rem] border border-prep-orange bg-prep-orange px-[.8rem] py-2 text-[.7rem] font-bold text-white hover:bg-prep-orange-dark max-[700px]:col-span-full max-[700px]:w-full"
            href={order.checkoutReference!}
          >
            Resume payment
          </Link>
        ) : null}
      </header>
      <section className="overflow-hidden rounded-[.45rem] border border-[#e3e1de]">
        <div className="grid grid-cols-[minmax(0,1fr)_8rem_4rem_8rem] items-center gap-4 bg-[#faf9f7] px-4 py-3 text-[.7rem] max-[950px]:hidden">
          <b>Order Items</b>
          <span>Price</span>
          <span>Qty</span>
          <span>Amount</span>
        </div>
        {order.items.map((item) => (
          <article
            className="grid grid-cols-[3.4rem_minmax(0,1fr)_8rem_4rem_8rem] items-center gap-4 border-t border-[#eceae7] px-4 py-3 max-[950px]:grid-cols-[3.4rem_minmax(0,1fr)_auto] max-[520px]:grid-cols-[2.8rem_minmax(0,1fr)_auto] max-[520px]:gap-3 max-[520px]:px-3"
            key={item.productId}
          >
            <i className="grid size-[3.2rem] place-items-center rounded-[.3rem] border border-[#eadfd8] bg-white p-[.35rem] not-italic text-prep-orange [&_img]:block [&_img]:size-full [&_img]:object-contain max-[520px]:size-[2.7rem]">
              <PrepstoreIcon />
            </i>
            <div className="min-w-0">
              <h2 className="m-0 text-[.8rem] break-words">{item.name}</h2>
              <p className="my-1 text-[.63rem] leading-relaxed text-[#747b80] max-[520px]:hidden">
                Study Materials&nbsp; • &nbsp;Tests &amp; Practice&nbsp; •
                &nbsp;Results &amp; Analytics
              </p>
              <small className="block text-[.63rem] text-[#747b80]">
                Valid for {item.accessDays} days from purchase
              </small>
            </div>
            <strong className="max-[950px]:hidden">
              {formatMoney(item.pricePaise, order.currency)}
            </strong>
            <span className="max-[950px]:hidden">1</span>
            <b className="text-right text-[.75rem] max-[520px]:text-[.7rem]">
              {formatMoney(item.pricePaise, order.currency)}
            </b>
          </article>
        ))}
      </section>
      <div className="mt-3 grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
        <section className="rounded-[.45rem] border border-[#e3e1de] p-4">
          <h2 className="mt-0 mb-[.55rem] text-[.85rem]">Payment Details</h2>
          <dl className="m-0 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:border-t [&>div]:border-[#e3e1de] [&>div]:py-[.62rem] [&>div]:text-[.7rem] [&_dt]:text-[#687077] [&_dd]:m-0 [&_dd]:max-w-[65%] [&_dd]:break-words [&_dd]:text-right">
            <div>
              <dt>Payment Method</dt>
              <dd>
                {order.provider ? order.provider.toUpperCase() : "Pending"}
              </dd>
            </div>
            <div>
              <dt>Payment Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-1 whitespace-normal rounded-full border px-2 py-1 text-[.62rem] font-bold ${statusClass(order.status)}`}
                >
                  ●{" "}
                  {order.paymentStatus ??
                    order.paymentAttemptStatus ??
                    order.status}
                </span>
              </dd>
            </div>
            <div>
              <dt>Transaction ID</dt>
              <dd>{order.providerPaymentId ?? "—"}</dd>
            </div>
            <div>
              <dt>Paid on</dt>
              <dd>
                {order.paidAt
                  ? new Date(order.paidAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="rounded-[.45rem] border border-[#e3e1de] p-4">
          <h2 className="mt-0 mb-[.55rem] text-[.85rem]">Price Summary</h2>
          <dl className="m-0 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:border-t [&>div]:border-[#e3e1de] [&>div]:py-[.62rem] [&>div]:text-[.7rem] [&_dt]:text-[#687077] [&_dd]:m-0 [&_dd]:text-right">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotalPaise, order.currency)}</dd>
            </div>
            {order.discountPaise > 0 ? (
              <div>
                <dt>
                  Coupon discount{" "}
                  {order.couponCode ? `(${order.couponCode})` : ""}
                </dt>
                <dd>− {formatMoney(order.discountPaise, order.currency)}</dd>
              </div>
            ) : null}
            {order.taxPaise > 0 ? (
              <div>
                <dt>Tax recorded</dt>
                <dd>{formatMoney(order.taxPaise, order.currency)}</dd>
              </div>
            ) : null}
            <div className="text-[1rem]! font-bold">
              <dt>Total Amount {paid ? "Paid" : "Due"}</dt>
              <dd>{formatMoney(order.totalPaise, order.currency)}</dd>
            </div>
          </dl>
          <p
            className={`mt-[.6rem] mb-0 rounded-[.35rem] p-[.7rem] text-[.65rem] leading-[1.45] ${paid ? "bg-[#e8f7ed] text-[#167442]" : "bg-[#fff4df] text-[#95600f]"}`}
          >
            {paid
              ? "✓ Payment completed successfully. A payment receipt is available for this order."
              : resumable
                ? "Payment is pending. Resume the secure checkout without creating another order."
                : "This checkout is no longer available. Start again from your cart."}
          </p>
        </section>
      </div>
    </WorkspaceShell>
  );
}
