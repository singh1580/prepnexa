import { CartPageClient } from "@/features/commerce/ui/cart-workflow";
import { listAvailableProducts } from "@/features/catalog/repository";
import { getCurrentAuth } from "@/features/auth/authorization";
export const metadata = {
  title: "Your cart",
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  const auth = await getCurrentAuth();
  const suggestions = (await listAvailableProducts(auth?.user.id))
    .filter((product) => !product.alreadyOwned)
    .slice(0, 6);
  return (
    <main className="mx-auto min-h-[calc(100vh-4.75rem)] w-full max-w-[1500px] min-w-0 overflow-x-clip px-[clamp(1rem,4vw,4rem)] pt-5 pb-12 [&_img]:max-w-full">
      <CartPageClient suggestions={suggestions} />
    </main>
  );
}
