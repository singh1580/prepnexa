export const adminFilterForm =
  "mb-[0.9rem] grid items-end gap-[0.65rem] rounded-[0.65rem] border border-prep-line bg-white p-[0.85rem] [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[0.35rem] [&_label>span]:text-[0.75rem] [&_label>span]:font-bold";

export const adminControl =
  "h-[2.65rem] w-full min-w-0 rounded-[0.45rem] border border-[#cacac5] bg-white px-[0.8rem] py-[0.55rem] outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]";

export const adminPrimaryButton =
  "inline-flex min-h-[2.65rem] items-center justify-center rounded-prep-control border border-prep-orange bg-prep-orange px-4 text-[0.75rem] font-[750] whitespace-nowrap text-white hover:bg-prep-orange-dark";

export const adminSecondaryButton =
  "inline-flex min-h-[2.65rem] items-center justify-center rounded-prep-control border border-[#d9dadd] bg-white px-4 text-[0.75rem] font-[750] whitespace-nowrap text-[#343a3f] hover:bg-[#f9fafb]";

export const adminDangerButton =
  "inline-flex min-h-[2.65rem] items-center justify-center gap-2 rounded-prep-control border border-[#d0473d] bg-white px-4 text-[0.75rem] font-[750] whitespace-nowrap text-[#b63129] hover:bg-[#fff1f0] disabled:cursor-not-allowed disabled:opacity-55 [&_svg]:size-4";

export const adminDangerNotice =
  "rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]";

export const adminBackLink =
  "mb-3 inline-flex min-h-11 items-center font-bold text-prep-orange-dark hover:underline";

export const adminDangerZone =
  "mt-4 grid grid-cols-[.25rem_minmax(0,1fr)_auto] items-center gap-4 rounded-[.55rem] border border-[#edd8d4] bg-white p-4 before:self-stretch before:rounded-full before:bg-[#d8564d] before:content-[''] max-[800px]:grid-cols-[.25rem_minmax(0,1fr)] max-[800px]:items-stretch [&>div:first-of-type]:grid [&>div:first-of-type]:gap-1 [&>div:first-of-type]:[grid-column:2] [&>div:first-of-type>strong]:text-[.78rem] [&>div:first-of-type>strong]:text-[#7e2e26] [&>div:first-of-type>span]:text-[.67rem] [&>div:first-of-type>span]:text-[#8a6c68] [&>div:last-child]:[grid-column:3] max-[800px]:[&>div:last-child]:[grid-column:2]";

const adminCardBase =
  "min-w-0 rounded-[0.65rem] border border-prep-line bg-white shadow-[0_1px_3px_rgba(16,24,40,0.04)]";
export const adminCard = `${adminCardBase} overflow-hidden`;
export const adminCardVisible = `${adminCardBase} overflow-visible`;

export const adminTable =
  "w-full border-collapse text-[0.82rem] [&_th]:border-y [&_th]:border-prep-line [&_th]:px-[0.8rem] [&_th]:py-[0.72rem] [&_th]:text-left [&_th]:text-[0.72rem] [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-[#60676d] [&_td]:border-b [&_td]:border-[#edf0f4] [&_td]:px-[0.8rem] [&_td]:py-[0.78rem] [&_td]:align-middle [&_td]:text-[#344054] [&_td>small]:block [&_td>small]:text-[0.72rem] [&_td>small]:text-prep-muted [&_td>strong]:block";

export const adminResponsiveTable = `${adminTable} max-[800px]:grid max-[800px]:min-w-0 max-[800px]:[&_thead]:hidden max-[800px]:[&_tbody]:grid max-[800px]:[&_tbody]:gap-3 max-[800px]:[&_tr]:grid max-[800px]:[&_tr]:overflow-hidden max-[800px]:[&_tr]:rounded-[0.6rem] max-[800px]:[&_tr]:border max-[800px]:[&_tr]:border-prep-line max-[800px]:[&_td]:grid max-[800px]:[&_td]:grid-cols-[minmax(6.7rem,0.42fr)_minmax(0,1fr)] max-[800px]:[&_td]:items-center max-[800px]:[&_td]:gap-[0.7rem] max-[800px]:[&_td]:border-0 max-[800px]:[&_td]:border-t max-[800px]:[&_td]:border-[#efedea] max-[800px]:[&_td]:px-3 max-[800px]:[&_td]:py-[0.62rem] max-[800px]:[&_td]:[overflow-wrap:anywhere] max-[800px]:[&_td]:before:text-[0.68rem] max-[800px]:[&_td]:before:font-[760] max-[800px]:[&_td]:before:tracking-[0.02em] max-[800px]:[&_td]:before:text-[#6d7479] max-[800px]:[&_td]:before:content-[attr(data-label)] max-[800px]:[&_td:first-child]:border-t-0 max-[380px]:[&_td]:grid-cols-1 max-[380px]:[&_td]:gap-1`;

export const adminEmptyState =
  "flex min-h-52 flex-col items-center justify-center p-8 text-center text-prep-muted";

export const adminPagination =
  "flex items-center justify-between gap-4 border-t border-[#e8e6e3] px-4 py-3 text-[0.67rem] text-prep-muted max-[800px]:flex-col max-[800px]:items-start max-[800px]:gap-2.5 [&_nav]:flex [&_nav]:gap-1 [&_a]:grid [&_a]:h-[1.8rem] [&_a]:min-w-[1.8rem] [&_a]:place-items-center [&_a]:rounded-[0.3rem] [&_a]:border [&_a:not([aria-current=page])]:border-[#ddd] [&_a[aria-current=page]]:border-prep-orange [&_a[aria-current=page]]:bg-prep-orange [&_a[aria-current=page]]:text-white [&_a[aria-disabled=true]]:pointer-events-none [&_a[aria-disabled=true]]:opacity-40";

export const adminDetailBackdrop =
  "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]";

const adminSideDetailBase =
  "fixed top-1/2 left-1/2 z-[45] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-prep-line bg-white shadow-[0_2rem_7rem_rgba(26,28,31,0.28)] max-[600px]:top-0 max-[600px]:left-0 max-[600px]:h-dvh max-[600px]:max-h-dvh max-[600px]:translate-x-0 max-[600px]:translate-y-0 max-[600px]:rounded-none";
export const adminSideDetail = `${adminSideDetailBase} w-[min(50rem,calc(100vw-2rem))] max-[600px]:w-full`;
export const adminStudentSideDetail = `${adminSideDetailBase} w-[min(64rem,calc(100vw-2rem))] max-[600px]:w-full`;

export const adminSideSection =
  "border-b border-prep-line px-[1.3rem] py-[1.15rem] [&_h3]:mb-3 [&_h3]:text-[0.82rem] [&_h3]:font-bold";

export const adminDetailHeader =
  "sticky top-0 z-10 flex min-h-[4.45rem] items-center justify-between gap-3 border-b border-prep-line bg-white px-[1.3rem] py-3 [&_h2]:text-base [&_h2]:font-bold";

export const adminDetailList =
  "grid gap-2 text-[0.76rem] [&>div]:flex [&>div]:items-start [&>div]:justify-between [&>div]:gap-4 [&_dt]:text-prep-muted [&_dd]:m-0 [&_dd]:max-w-[62%] [&_dd]:text-right [&_dd]:font-semibold [&_dd]:[overflow-wrap:anywhere]";

export const adminMiniRecord =
  "flex items-center justify-between gap-3 border-t border-[#eee9e3] py-3 text-[0.76rem] first:border-t-0 [&>div]:grid [&>div]:min-w-0 [&_small]:mt-0.5 [&_small]:text-[0.68rem] [&_small]:text-prep-muted [&_strong]:[overflow-wrap:anywhere]";

export function adminStatusClass(status: string) {
  if (
    ["ACTIVE", "PAID", "ENABLED", "RESOLVED", "CAPTURED", "COMPLETED"].includes(
      status,
    )
  )
    return "border-[#bfe2cc] bg-[#e7f4ec] text-[#276448]";
  if (
    [
      "PENDING",
      "PENDING_VERIFICATION",
      "CREATED",
      "REQUIRED",
      "OPEN",
      "PROCESSING",
      "AUTHORIZED",
      "IN_PROGRESS",
      "WAITING_FOR_STUDENT",
    ].includes(status)
  )
    return "border-[#f1d79b] bg-[#fff4d9] text-[#8a5b13]";
  if (["FAILED", "SUSPENDED", "BLOCKED", "REJECTED"].includes(status))
    return "border-[#efc1bd] bg-[#fdebea] text-[#ad3028]";
  if (["REFUNDED", "PARTIALLY_REFUNDED"].includes(status))
    return "border-[#cdd8f1] bg-[#edf2ff] text-[#405f9d]";
  return "border-[#d9dce0] bg-[#f0f1f2] text-[#5f666d]";
}

export const adminStatusPill =
  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-bold leading-tight whitespace-nowrap";
