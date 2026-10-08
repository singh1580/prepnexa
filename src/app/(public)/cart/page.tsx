import { CartPageClient } from "@/features/commerce/ui/cart-workflow";
import { listAvailableProducts } from "@/features/catalog/repository";
import { getCurrentAuth } from "@/features/auth/authorization";
export const metadata={title:"Your cart"};
export const dynamic="force-dynamic";
export default async function Page(){const auth=await getCurrentAuth();const suggestions=(await listAvailableProducts(auth?.user.id)).filter(product=>!product.alreadyOwned).slice(0,6);return <main className="reference-commerce-page"><CartPageClient suggestions={suggestions}/></main>;}
