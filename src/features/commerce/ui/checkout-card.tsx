"use client";

import { useRouter } from "next/navigation";
import { AddToCartButton, addCartItem } from "./cart-workflow";

export function CheckoutCard({productId,pricePaise}:{productId:string;pricePaise:number}){
  const router=useRouter();
  function buyNow(){addCartItem(productId);router.push("/checkout");}
  return <div className="reference-purchase-actions"><AddToCartButton productId={productId} className="reference-add-cart"/><button className="reference-buy-now" type="button" onClick={buyNow}>{pricePaise===0?"Get access":"Buy now"}</button><small>Final payable price, including GST, is verified securely at checkout.</small></div>;
}
