"use client";

export function PrintInvoiceButton() {
  return <div className="print-actions"><button className="reference-checkout-button" type="button" onClick={() => window.print()}>▣ Print</button><button className="reference-outline-button" type="button" onClick={() => window.print()}>⇩ Save as PDF</button></div>;
}
