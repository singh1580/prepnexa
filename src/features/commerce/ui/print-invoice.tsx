"use client";
import { UiIcon } from "@/components/ui-icon";

export function PrintInvoiceButton() {
  return (
    <div className="flex gap-[.55rem] print:hidden max-[700px]:grid max-[700px]:grid-cols-2">
      <button
        className="flex min-h-10 min-w-32 cursor-pointer items-center justify-center gap-[.45rem] rounded-[.35rem] border border-prep-orange bg-prep-orange px-4 py-[.55rem] text-[.75rem] font-[760] text-white hover:border-prep-orange-dark hover:bg-prep-orange-dark max-[700px]:min-w-0 [&>svg]:size-4 [&>svg]:shrink-0"
        type="button"
        onClick={() => window.print()}
      >
        <UiIcon name="print" /> Print
      </button>
      <button
        className="flex min-h-10 min-w-32 cursor-pointer items-center justify-center gap-[.45rem] rounded-[.35rem] border border-prep-orange bg-white px-4 py-[.55rem] text-[.75rem] font-[760] text-prep-orange hover:bg-prep-orange-soft max-[700px]:min-w-0 [&>svg]:size-4 [&>svg]:shrink-0"
        type="button"
        onClick={() => window.print()}
      >
        <UiIcon name="download" /> Save as PDF
      </button>
    </div>
  );
}
