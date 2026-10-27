"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function MenuIcon() {
  return (
    <span
      className="absolute top-2.5 left-0 grid h-6 w-[25px] content-center gap-[5px]"
      aria-hidden="true"
    >
      <i className="block h-0.5 w-full rounded-full bg-[#17191c]" />
      <i className="block h-0.5 w-full rounded-full bg-prep-orange" />
      <i className="block h-0.5 w-full rounded-full bg-[#17191c]" />
    </span>
  );
}

export function MobileDrawer({
  className,
  drawerClassName,
  label,
  children,
  variant,
}: {
  className: string;
  drawerClassName: string;
  label: string;
  children: React.ReactNode;
  variant: "public" | "workspace";
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((restoreFocus = true) => {
    const details = detailsRef.current;
    if (!details) return;
    details.open = false;
    setOpen(false);
    if (restoreFocus) details.querySelector("summary")?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = detailsRef.current?.querySelector<HTMLElement>(
      `.${drawerClassName}`,
    );
    window.requestAnimationFrame(() => {
      drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerClassName, open]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDetailsElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !open) return;
    const drawer = detailsRef.current?.querySelector<HTMLElement>(
      `.${drawerClassName}`,
    );
    const focusable = drawer
      ? Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleDrawerClick(event: ReactMouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) close(false);
  }

  return (
    <details
      className={`group relative hidden h-11 w-[25px] shrink-0 max-[1099px]:block ${className}`}
      ref={detailsRef}
      onKeyDown={handleKeyDown}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className={`relative z-[103] block size-11 cursor-pointer list-none border-0 bg-transparent p-0 text-[#17191c] shadow-none marker:hidden [&::-webkit-details-marker]:hidden ${variant === "public" ? "group-open:fixed group-open:top-[calc(var(--mobile-header-height)+18px)] group-open:right-[clamp(26px,5vw,34px)]" : "group-open:fixed group-open:top-3 group-open:left-[calc(var(--workspace-drawer-width)-58px)] group-open:z-[210]"}`}
        aria-label={open ? "Close navigation" : label}
      >
        <MenuIcon />
      </summary>
      <button
        className={
          variant === "workspace"
            ? "fixed inset-0 z-[208] hidden size-full cursor-pointer border-0 bg-[rgb(21_23_25_/_38%)] p-0 group-open:max-[1099px]:block"
            : "hidden"
        }
        type="button"
        tabIndex={-1}
        aria-label="Close navigation"
        onClick={() => close()}
      />
      <div
        className={`${drawerClassName} fixed z-[209] flex max-w-[calc(100vw-32px)] flex-col overflow-x-hidden overflow-y-auto bg-white text-[#17191c] shadow-[0_18px_48px_rgb(25_18_12_/_18%)] [overscroll-behavior:contain] motion-reduce:animate-none ${variant === "public" ? "top-[calc(var(--mobile-header-height)+8px)] left-4 max-h-[calc(100dvh-var(--mobile-header-height)-24px)] w-[min(380px,calc(100vw-32px))] animate-[prepstore-drawer-enter_180ms_ease-out] rounded-[14px] border border-[#e8e3de] px-4 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))] max-[340px]:left-2.5 max-[340px]:w-[calc(100vw-20px)] max-[340px]:max-w-[calc(100vw-20px)]" : "inset-y-0 left-0 min-h-dvh max-h-dvh w-[min(360px,calc(100vw-32px))] animate-[prepstore-workspace-drawer-enter_190ms_ease-out] border-r border-[#e8e3de] px-4 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] shadow-[20px_0_55px_rgb(25_18_12_/_22%)] [--workspace-drawer-width:min(360px,calc(100vw-32px))]"}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={handleDrawerClick}
      >
        {children}
      </div>
    </details>
  );
}
