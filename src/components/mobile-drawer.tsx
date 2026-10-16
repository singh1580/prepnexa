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
    <span className="menu-icon-3d" aria-hidden="true">
      <i className="menu-icon-bar menu-icon-bar-top" />
      <i className="menu-icon-bar menu-icon-bar-middle" />
      <i className="menu-icon-bar menu-icon-bar-bottom" />
    </span>
  );
}

export function MobileDrawer({
  className,
  drawerClassName,
  label,
  children,
}: {
  className: string;
  drawerClassName: string;
  label: string;
  children: React.ReactNode;
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
      className={className}
      ref={detailsRef}
      onKeyDown={handleKeyDown}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-label={open ? "Close navigation" : label}>
        <MenuIcon />
      </summary>
      <button
        className="mobile-drawer-backdrop"
        type="button"
        tabIndex={-1}
        aria-label="Close navigation"
        onClick={() => close()}
      />
      <div
        className={drawerClassName}
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
