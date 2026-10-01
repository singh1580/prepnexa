import { CartPageClient } from "@/features/commerce/ui/cart-workflow";
import { listAvailableProducts } from "@/features/catalog/repository";
export const metadata={title:"Your cart"};
export const dynamic="force-dynamic";
export default async function Page(){const suggestions=(await listAvailableProducts()).slice(0,6);return <main className="reference-commerce-page"><CartPageClient suggestions={suggestions}/></main>;}
