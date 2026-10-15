export type UiIconName =
  | "chevron"
  | "clear"
  | "close"
  | "document"
  | "language"
  | "review"
  | "save"
  | "trash";

export function UiIcon({ name, className }: { name: UiIconName; className?: string }) {
  const paths: Record<UiIconName, React.ReactNode> = {
    chevron: <path d="m8 10 4 4 4-4" />,
    clear: <><path d="m4 15 8-8 6 6-6 6H8z" /><path d="m13.5 8.5 6 6M12 19h8" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    document: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    review: <path d="M6 3h12v18l-6-4-6 4z" />,
    save: <><path d="M7 18h10a4 4 0 0 0 .7-7.9A6 6 0 0 0 6.2 8.5 4.5 4.5 0 0 0 7 18Z" /><path d="m9.5 13 1.7 1.7 3.6-3.7" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
  };
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
