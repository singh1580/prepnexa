import { CheckoutPageClient } from "@/features/commerce/ui/cart-workflow";
import { getCurrentAuth } from "@/features/auth/authorization";
export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  const auth = await getCurrentAuth();
  const coupon = (await searchParams).coupon?.slice(0, 60) ?? "";
  const account = auth
    ? { name: auth.user.name, email: auth.user.email, phone: auth.user.phone }
    : null;
  return (
    <main className="mx-auto min-h-[calc(100vh-4.75rem)] w-full max-w-[1500px] min-w-0 overflow-x-clip px-[clamp(1rem,4vw,4rem)] pt-5 pb-12 [&_img]:max-w-full">
      <CheckoutPageClient account={account} initialCoupon={coupon} />
    </main>
  );
}
