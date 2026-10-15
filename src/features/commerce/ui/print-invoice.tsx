"use client";
import { UiIcon } from "@/components/ui-icon";

export function PrintInvoiceButton() {
  return <div className="print-actions"><button className="reference-checkout-button" type="button" onClick={() => window.print()}><UiIcon name="print" /> Print</button><button className="reference-outline-button" type="button" onClick={() => window.print()}><UiIcon name="download" /> Save as PDF</button></div>;
}
