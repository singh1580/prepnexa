import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  kicker,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  kicker?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-[1.1rem] flex items-center justify-between gap-5 max-[600px]:items-start max-[600px]:flex-col">
      <div className="min-w-0">
        {kicker ? (
          <p className="mb-2 text-[0.68rem] font-extrabold tracking-[0.13em] text-prep-orange-dark">
            {kicker}
          </p>
        ) : null}
        <h1 className="m-0 mb-[0.3rem] text-[clamp(1.65rem,2.4vw,2.25rem)] leading-[1.08] tracking-[-0.04em] text-[#101828]">
          {title}
        </h1>
        {description ? (
          <p className="m-0 max-w-3xl text-[0.88rem] leading-[1.55] text-prep-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
