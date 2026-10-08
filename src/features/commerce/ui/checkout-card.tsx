"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddToCartButton, addCartItem } from "./cart-workflow";

export function CheckoutCard({productId,slug,pricePaise,owned=false}:{productId:string;slug:string;pricePaise:number;owned?:boolean}){
  const router=useRouter();
  function buyNow(){addCartItem(productId);router.push("/checkout");}
  if(owned)return <div className="reference-purchase-actions owned-package-actions"><span>✓ Already purchased</span><Link className="reference-buy-now" href={`/dashboard/courses/${slug}`}>Open package →</Link><small>This package is already available in My Packages.</small></div>;
  return <div className="reference-purchase-actions"><AddToCartButton productId={productId} className="reference-add-cart"/><button className="reference-buy-now" type="button" onClick={buyNow}>{pricePaise===0?"Get access":"Buy now"}</button><small>Final payable price, including GST, is verified securely at checkout.</small></div>;
}
