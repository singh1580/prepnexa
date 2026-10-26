import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentOrder } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { formatMoney } from "@/features/commerce/pricing";
import { RemovePurchasedCartItems } from "@/features/commerce/ui/cart-workflow";

type Order = {
  id: string;
  status: string;
  totalPaise: number;
  currency: string;
  items: {
    productId: string;
    name: string;
    pricePaise: number;
    accessDays: number;
  }[];
};
export const metadata = { title: "Payment successful" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = commerceIdSchema.safeParse((await searchParams).order);
  if (!parsed.success) notFound();
  const raw = await getStudentOrder(parsed.data, auth.user.id);
  if (!raw) notFound();
  const order = raw as unknown as Order;
  if (!["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(order.status))
    redirect(`/dashboard/orders/${order.id}`);
  return (
    <>
      <PublicHeader />
      <main className="min-h-[calc(100vh-4.75rem)] bg-white px-5 py-12">
        <RemovePurchasedCartItems
          productIds={order.items.map((item) => item.productId)}
        />
        <section className="m-auto w-[min(100%,43rem)] text-center">
          <span
            className="mx-auto mb-[1.4rem] grid size-[4.8rem] place-items-center rounded-full bg-[#08a14a] text-[2.8rem] text-white"
            aria-hidden="true"
          >
            ✓
          </span>
          <h1 className="mt-[.8rem] mb-[.4rem] text-[2rem]">
            Payment successful!
          </h1>
          <p className="text-[.78rem] leading-[1.55] text-[#646a70]">
            Thank you for your purchase. Your packages are now active
            <br />
            and ready to use.
          </p>
          <div className="my-4 grid gap-[.15rem] rounded-[.7rem] bg-[#faf8f5] p-4 [&>span]:text-[var(--muted)] [&>small]:text-[var(--muted)]">
            <span>Order ID</span>
            <strong className="text-[1.1rem]">
              #{order.id.slice(0, 12).toUpperCase()}
            </strong>
            <small>Amount paid</small>
            <b className="text-xl">
              {formatMoney(order.totalPaise, order.currency)}
            </b>
          </div>
          <section className="rounded-[.45rem] border border-[#e0dedb] p-4 text-left">
            <h2 className="mt-0 mb-[.55rem] text-[.82rem]">
              Your purchased packages
            </h2>
            {order.items.map((item) => (
              <article
                className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-t border-[#ece9e5] py-[.65rem] max-[520px]:grid-cols-[3rem_1fr]"
                key={item.productId}
              >
                <span className="grid size-12 place-items-center rounded-[.35rem] bg-[#ffb17e] font-extrabold text-[#8b2d0b]">
                  {item.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="[&>*]:block">
                  <strong className="text-[.75rem]">{item.name}</strong>
                  <small className="mt-1 text-[.66rem] text-[#777]">
                    {Math.max(1, Math.round(item.accessDays / 30))} months
                    access
                  </small>
                </div>
                <b className="text-[.75rem] max-[520px]:col-start-2">
                  {formatMoney(item.pricePaise, order.currency)}
                </b>
              </article>
            ))}
          </section>
          <div className="my-4 flex gap-[.7rem] rounded-[.4rem] border border-[#bfe9cc] bg-[#eefbf2] p-[.9rem] text-left text-[#197b3e]">
            <b>◷</b>
            <span className="block">
              <strong className="block">Next step</strong>
              <small className="mt-[.2rem] block text-[.68rem] text-[#4f6758]">
                You can now start learning. Your packages are available in My
                Packages.
              </small>
            </span>
          </div>
          <div className="flex justify-center gap-[.7rem] max-[520px]:grid">
            <Link
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-prep-orange px-4 py-[.7rem] text-[.8rem] font-[760] text-white hover:border-prep-orange-dark hover:bg-prep-orange-dark"
              href="/dashboard/courses"
            >
              Go to My Packages
            </Link>
            <Link
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-white px-4 py-[.7rem] text-[.8rem] font-[760] text-prep-orange hover:bg-prep-orange-soft"
              href={`/dashboard/orders/${order.id}`}
            >
              View order details
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
