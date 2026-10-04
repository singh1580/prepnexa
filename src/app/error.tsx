"use client";
import { useEffect } from "react";
import { Brand } from "@/components/brand";

export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(() => { console.error(error); }, [error]);
  return <main className="state-page"><Brand /><div className="state-icon neutral" aria-hidden="true">!</div><span className="eyebrow">TEMPORARY PROBLEM</span><h1>Something went wrong</h1><p>The problem has been recorded. Try this page again.</p><button className="button" onClick={reset}>Try again</button></main>;
}
