"use client";

import { useState, type ReactNode } from "react";

type TabKey="description"|"syllabus"|"included"|"reviews"|"faqs";
const tabs:[TabKey,string][]=[["description","Description"],["syllabus","Syllabus"],["included","What's included"],["reviews","Reviews"],["faqs","FAQs"]];

export function ProductDetailTabs({panels}:{panels:Record<TabKey,ReactNode>}){
  const[active,setActive]=useState<TabKey>("description");
  return <section className="product-tab-shell"><nav className="reference-product-tabs" aria-label="Package details" role="tablist">{tabs.map(([key,label])=><button key={key} type="button" role="tab" className={active===key?"active":""} aria-selected={active===key} aria-controls={`package-panel-${key}`} id={`package-tab-${key}`} onClick={()=>setActive(key)}>{label}</button>)}</nav><div className="reference-product-panel" id={`package-panel-${active}`} role="tabpanel" aria-labelledby={`package-tab-${active}`}>{panels[active]}</div></section>;
}
