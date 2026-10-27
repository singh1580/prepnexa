import Link from "next/link";
import { notFound } from "next/navigation";
import { PrepstoreLogo } from "@/components/brand";
import { requireWorkspace } from "@/features/auth/page-access";
import { getManagedOrder, getStudentOrder } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { formatMoney } from "@/features/commerce/pricing";
import { PrintInvoiceButton } from "@/features/commerce/ui/print-invoice";
import {
  formatAccessDuration,
  normaliseProductName,
} from "@/features/catalog/presentation";

type Order = {
  id: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  couponCode: string | null;
  billingPhone: string | null;
  createdAt: Date;
  paidAt: Date | null;
  provider: string | null;
  providerPaymentId: string | null;
  studentName?: string;
  email?: string;
  items: {
    productId: string;
    name: string;
    pricePaise: number;
    accessDays: number;
  }[];
};
export const metadata = { title: "Payment receipt" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspace();
  const parsed = commerceIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const raw = auth.admin
    ? await getManagedOrder(parsed.data)
    : await getStudentOrder(parsed.data, auth.user.id);
  if (!raw) notFound();
  const order = raw as unknown as Order;
  if (!["PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(order.status))
    notFound();
  const issued = new Date(order.paidAt ?? order.createdAt);
  const backHref = auth.admin
    ? `/admin/orders?order=${order.id}`
    : `/dashboard/orders/${order.id}`;
  return (
    <main className="min-h-screen bg-white px-5 pb-12 text-[#14171b] print:min-h-0 print:p-0 max-[700px]:px-[.85rem] max-[700px]:pb-8">
      <header className="mx-auto mb-5 flex min-h-[4.5rem] max-w-[70rem] items-center justify-between gap-4 border-b border-[var(--review-line)] print:hidden max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:py-[.6rem] max-[700px]:pb-[.9rem] [&_.brand-logo-link]:w-[188px] [&_.brand-logo-link]:min-w-[188px] [&_.brand-logo]:h-[34px] [&_.brand-logo]:w-[188px] max-[420px]:[&_.brand-logo-link]:w-[177px] max-[420px]:[&_.brand-logo-link]:min-w-[177px] max-[420px]:[&_.brand-logo]:h-8 max-[420px]:[&_.brand-logo]:w-[177px]">
        <PrepstoreLogo />
        <div className="flex items-center justify-end gap-[.8rem] max-[700px]:flex-col max-[700px]:items-stretch">
          <Link
            className="inline-flex min-h-10 items-center rounded-[.42rem] px-3 py-[.55rem] font-[720] text-[#4d545a] hover:bg-[var(--review-orange-soft)] hover:text-[#c83e10]"
            href={backHref}
          >
            ← <span>Back to order</span>
          </Link>
          <PrintInvoiceButton />
        </div>
      </header>
      <article className="mx-auto max-w-[70rem] rounded-[.55rem] border border-[#e1dfdc] bg-white p-[2.2rem] shadow-[0_.65rem_2rem_#3a2b2110] print:m-0 print:w-full print:max-w-none print:break-inside-avoid print:rounded-none print:border-0 print:p-0 print:shadow-none max-[700px]:p-4">
        <header className="flex items-start justify-between gap-8 border-b border-[#bbb] pb-6 max-[700px]:grid max-[700px]:gap-4 max-[700px]:pb-4">
          <div className="grid min-w-0 gap-1 [&_.brand-logo-link]:min-h-9 [&_.brand-logo-link]:w-[164px] [&_.brand-logo-link]:min-w-[164px] [&_.brand-logo]:h-auto [&_.brand-logo]:w-[164px]">
            <PrepstoreLogo />
            <b className="mt-[.7rem] text-[.74rem]">
              Prepstore Digital Learning
            </b>
            <small className="mt-1 leading-normal text-[var(--muted)]">
              Digital exam-preparation platform
              <br />
              India
            </small>
          </div>
          <div className="grid min-w-0 justify-items-end gap-[.35rem] max-[700px]:justify-items-stretch">
            <h1 className="mt-0 mb-[.65rem] text-right text-[1.55rem] max-[700px]:mt-[.2rem] max-[700px]:text-left max-[700px]:text-[1.35rem]">
              Payment receipt
            </h1>
            <dl className="m-0 w-full [&>div]:flex [&>div]:justify-end [&>div]:gap-[.4rem] [&>div]:text-[.68rem] [&>div]:leading-[1.55] [&_dt]:shrink-0 [&_dt]:text-[#555] [&_dd]:m-0 [&_dd]:max-w-72 [&_dd]:[overflow-wrap:anywhere] max-[700px]:[&>div]:grid max-[700px]:[&>div]:w-full max-[700px]:[&>div]:grid-cols-[6.2rem_minmax(0,1fr)] max-[700px]:[&>div]:justify-stretch max-[700px]:[&>div]:text-[.72rem] max-[700px]:[&_dd]:text-right">
              <div>
                <dt>Receipt No:</dt>
                <dd>RCP-{order.id.slice(0, 12).toUpperCase()}</dd>
              </div>
              <div>
                <dt>Receipt Date:</dt>
                <dd>
                  {issued.toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </dd>
              </div>
              <div>
                <dt>Order ID:</dt>
                <dd>{order.id.slice(0, 16).toUpperCase()}</dd>
              </div>
              <div>
                <dt>Payment ID:</dt>
                <dd>{order.providerPaymentId ?? "Free order"}</dd>
              </div>
              <div>
                <dt>Payment Method:</dt>
                <dd>
                  {order.provider?.toUpperCase() ?? "No payment required"}
                </dd>
              </div>
            </dl>
          </div>
        </header>
        <section className="flex items-start justify-between gap-4 border-b border-[#ccc] py-[1.2rem] print:break-inside-avoid max-[390px]:flex-col">
          <div className="min-w-0 [&>*]:block">
            <span className="text-[.7rem] font-bold">Billed to</span>
            <strong className="my-1 text-[.8rem]">
              {order.studentName ?? auth.user.name}
            </strong>
            <small className="min-w-0 break-words leading-[1.45] text-[#596066]">
              {order.email ?? auth.user.email}
              {order.billingPhone ? (
                <>
                  <br />
                  {String(order.billingPhone)}
                </>
              ) : null}
            </small>
          </div>
          <b className="rounded-[.35rem] border border-[#35a95f] bg-[#edfbf1] px-[1.1rem] py-[.3rem] text-[.72rem] text-[#218247] max-[390px]:self-start">
            {order.status === "PAID"
              ? "PAID"
              : order.status.replaceAll("_", " ")}
          </b>
        </section>
        <div className="mt-5">
          <table className="mt-[1.3rem] w-full border-collapse max-[700px]:mt-0 max-[700px]:block [&_th]:border-b [&_th]:border-[var(--line)] [&_th]:bg-[#f0f0ef] [&_th]:p-[.7rem] [&_th]:text-left [&_th]:text-[.7rem] [&_th]:text-[#222] [&_th:last-child]:text-right">
            <thead className="max-[700px]:hidden">
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Access period</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody className="max-[700px]:grid max-[700px]:w-full max-[700px]:gap-[.7rem]">
              {order.items.map((item, index) => (
                <tr
                  className="print:break-inside-avoid max-[700px]:block max-[700px]:w-full max-[700px]:rounded-[.45rem] max-[700px]:border max-[700px]:border-[#e5e2de] max-[700px]:px-[.7rem] max-[700px]:py-[.3rem] [&>td]:border-b [&>td]:border-[var(--line)] [&>td]:p-[.7rem] [&>td]:text-left [&>td]:text-[.7rem] [&>td:last-child]:text-right max-[700px]:[&>td]:grid max-[700px]:[&>td]:w-full max-[700px]:[&>td]:grid-cols-[7rem_minmax(0,1fr)] max-[700px]:[&>td]:gap-[.7rem] max-[700px]:[&>td]:border-b max-[700px]:[&>td]:border-[#efedea] max-[700px]:[&>td]:px-0 max-[700px]:[&>td]:py-[.48rem] max-[700px]:[&>td]:text-right max-[700px]:[&>td]:before:text-left max-[700px]:[&>td]:before:text-[.68rem] max-[700px]:[&>td]:before:font-[650] max-[700px]:[&>td]:before:text-[#70777c] max-[700px]:[&>td]:before:content-[attr(data-label)] max-[700px]:[&>td:last-child]:border-b-0 max-[700px]:[&>td:last-child]:font-[750]"
                  key={item.productId}
                >
                  <td data-label="Item">{index + 1}</td>
                  <td
                    className="[overflow-wrap:anywhere]"
                    data-label="Description"
                  >
                    {normaliseProductName(item.name)}
                  </td>
                  <td data-label="Access period">
                    {formatAccessDuration(item.accessDays)}
                  </td>
                  <td data-label="Amount">
                    {formatMoney(item.pricePaise, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="flex justify-end py-4 print:break-inside-avoid max-[700px]:justify-stretch">
          <dl className="m-0 w-[min(100%,25rem)] max-[700px]:w-full [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:py-[.4rem] [&>div]:text-[.72rem] [&_dd]:m-0 [&>div:last-child]:mt-[.6rem] [&>div:last-child]:border-0 [&>div:last-child]:bg-[#fff2e9] [&>div:last-child]:p-[.7rem] [&>div:last-child]:text-base [&>div:last-child]:font-extrabold">
            {order.taxPaise === 0 ? (
              <>
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
                    <dd>
                      − {formatMoney(order.discountPaise, order.currency)}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
            <div>
              <dt>Total paid</dt>
              <dd>{formatMoney(order.totalPaise, order.currency)}</dd>
            </div>
          </dl>
        </section>
        <section className="border-t border-[#ddd] pt-4 print:break-inside-avoid">
          <h2 className="text-[.72rem]">Terms</h2>
          <ol className="my-2 pl-[1.1rem] text-[.66rem] leading-[1.55] text-[#5f656a]">
            <li>
              This is a computer-generated payment receipt and does not require
              a signature. It is not a GST tax invoice.
            </li>
            <li>
              Access to purchased digital content is provided after successful
              payment.
            </li>
            <li>
              For any queries, contact Prepstore support from your dashboard.
            </li>
          </ol>
        </section>
      </article>
    </main>
  );
}
