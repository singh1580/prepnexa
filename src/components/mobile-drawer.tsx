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
      className="absolute top-2.5 left-0 h-6 w-[25px] [perspective:140px] [transform-style:preserve-3d]"
      aria-hidden="true"
    >
      <i className="absolute top-0 left-0 block h-[5px] w-[25px] origin-center rounded-full bg-[#17191c] shadow-[0_2px_0_rgb(0_0_0_/_50%),0_5px_8px_rgb(23_25_28_/_14%)] transition-[left,width,transform] duration-[180ms] ease-out [animation:prepstore-menu-top-depth_2s_ease-in-out_infinite] [backface-visibility:hidden] [transform-style:preserve-3d] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(180deg,rgb(255_255_255_/_22%),transparent_48%)] group-open:left-0.5 group-open:w-[21px] group-open:animate-none group-open:[transform:translateZ(5px)]" />
      <i className="absolute top-[9px] left-[3px] block h-[5px] w-[19px] origin-center rounded-full bg-prep-orange shadow-[0_2px_0_rgb(111_28_4_/_44%),0_5px_8px_rgb(233_75_23_/_18%)] transition-[left,width,transform] duration-[180ms] ease-out [animation:prepstore-menu-middle-depth_2s_ease-in-out_infinite] [backface-visibility:hidden] [transform-style:preserve-3d] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(180deg,rgb(255_255_255_/_22%),transparent_48%)] group-open:left-0 group-open:w-[25px] group-open:animate-none group-open:[transform:translateZ(11px)]" />
      <i className="absolute top-[18px] left-px block h-[5px] w-[23px] origin-center rounded-full bg-[#17191c] shadow-[0_2px_0_rgb(0_0_0_/_50%),0_5px_8px_rgb(23_25_28_/_14%)] transition-[left,width,transform] duration-[180ms] ease-out [animation:prepstore-menu-bottom-depth_2s_ease-in-out_infinite] [backface-visibility:hidden] [transform-style:preserve-3d] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(180deg,rgb(255_255_255_/_22%),transparent_48%)] group-open:left-[3px] group-open:w-[19px] group-open:animate-none group-open:[transform:translateZ(5px)]" />
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
      className={`group relative hidden h-11 w-[25px] shrink-0 max-[1099px]:block ${variant === "workspace" ? "[--workspace-drawer-width:min(360px,calc(100vw-32px))]" : ""} ${className}`}
      ref={detailsRef}
      onKeyDown={handleKeyDown}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className={`relative z-[103] block size-11 cursor-pointer list-none border-0 bg-transparent p-0 text-[#17191c] shadow-none marker:hidden [&::-webkit-details-marker]:hidden ${variant === "workspace" ? "group-open:fixed group-open:top-3 group-open:left-[calc(var(--workspace-drawer-width)-58px)] group-open:z-[210]" : ""}`}
        aria-label={open ? "Close navigation" : label}
      >
        <MenuIcon />
      </summary>
      <button
        className={
          variant === "workspace"
            ? "fixed inset-0 z-[208] hidden size-full cursor-pointer border-0 bg-[rgb(21_23_25_/_38%)] p-0 group-open:max-[1099px]:block"
            : "fixed inset-0 z-[99] hidden size-full cursor-pointer border-0 bg-[rgb(21_23_25_/_16%)] p-0 group-open:max-[1099px]:block"
        }
        type="button"
        tabIndex={-1}
        aria-label="Close navigation"
        onClick={() => close()}
      />
      <div
        className={`${drawerClassName} fixed flex max-w-[calc(100vw-32px)] flex-col overflow-x-hidden overflow-y-auto bg-white text-[#17191c] shadow-[0_18px_48px_rgb(25_18_12_/_18%)] [overscroll-behavior:contain] motion-reduce:animate-none ${variant === "public" ? "top-[calc(var(--mobile-header-height)+8px)] left-4 z-[100] max-h-[calc(100dvh-var(--mobile-header-height)-24px)] w-[min(380px,calc(100vw-32px))] animate-[prepstore-drawer-enter_180ms_ease-out] rounded-[14px] border border-[#e8e3de] px-4 pt-3.5 pb-[max(14px,env(safe-area-inset-bottom))] max-[340px]:left-2.5 max-[340px]:w-[calc(100vw-20px)] max-[340px]:max-w-[calc(100vw-20px)]" : "inset-y-0 left-0 z-[209] min-h-dvh max-h-dvh w-[var(--workspace-drawer-width)] animate-[prepstore-workspace-drawer-enter_190ms_ease-out] border-r border-[#e8e3de] px-4 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] shadow-[20px_0_55px_rgb(25_18_12_/_22%)]"}`}
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
