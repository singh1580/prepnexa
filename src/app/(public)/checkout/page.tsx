import { CheckoutPageClient } from "@/features/commerce/ui/cart-workflow";
import { getCurrentAuth } from "@/features/auth/authorization";
export const metadata={title:"Checkout"};
export const dynamic="force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{coupon?:string}>}){const auth=await getCurrentAuth();const coupon=(await searchParams).coupon?.slice(0,60)??"";const account=auth?{name:auth.user.name,email:auth.user.email,phone:auth.user.phone}:null;return <main className="reference-commerce-page checkout-page"><CheckoutPageClient account={account} initialCoupon={coupon}/></main>;}
