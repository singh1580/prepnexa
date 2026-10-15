export type UiIconName =
  | "chevron"
  | "clear"
  | "close"
  | "document"
  | "download"
  | "export"
  | "language"
  | "print"
  | "review"
  | "save"
  | "send"
  | "trash";

export function UiIcon({ name, className }: { name: UiIconName; className?: string }) {
  const paths: Record<UiIconName, React.ReactNode> = {
    chevron: <path d="m8 10 4 4 4-4" />,
    clear: <><path d="m4 15 8-8 6 6-6 6H8z" /><path d="m13.5 8.5 6 6M12 19h8" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    document: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
    download: <><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M5 20h14" /></>,
    export: <><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M5 13v7h14v-7" /></>,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    print: <><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v7H7z" /></>,
    review: <path d="M6 3h12v18l-6-4-6 4z" />,
    save: <><path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.2 8.5 4.5 4.5 0 0 0 7 18Z" /><path d="m9.5 13 1.7 1.7 3.6-3.7" /></>,
    send: <><path d="m3 11 18-8-8 18-2.5-7.5z" /><path d="M10.5 13.5 21 3" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
  };
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
