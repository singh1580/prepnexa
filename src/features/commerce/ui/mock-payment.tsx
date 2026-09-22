"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { commerceRequest } from "./api";

export function MockPayment({ attemptId }: { attemptId:string }) {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function confirm(){setBusy(true);setError("");try{await commerceRequest("commerce/mock/confirm",{attemptId});router.push("/dashboard/orders?completed=payment");}catch(value){setError(value instanceof Error?value.message:"Payment failed.");setBusy(false);}}
  return <section className="panel mock-payment"><span className="eyebrow">TEST PAYMENT PROVIDER</span><h1>Complete a mock payment</h1><p>No real money will be charged. This screen exercises the same verified-payment and entitlement flow used by a future production adapter.</p><button className="button full" type="button" disabled={busy} onClick={confirm}>{busy?"Confirming…":"Simulate successful payment"}</button>{error&&<p className="notice danger" role="alert">{error}</p>}</section>;
}
