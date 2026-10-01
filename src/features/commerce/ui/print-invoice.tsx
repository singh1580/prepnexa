"use client";

export function PrintInvoiceButton() {
  return <button className="button secondary" type="button" onClick={() => window.print()}>Print / Save as PDF</button>;
}
