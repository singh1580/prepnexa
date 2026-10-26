"use client";
import { useId, useRef, useState } from "react";
import { UiIcon } from "./ui-icon";
export function AdminModal({
  label,
  title,
  description,
  large = false,
  secondary = false,
  icon,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  large?: boolean;
  secondary?: boolean;
  icon?: React.ComponentProps<typeof UiIcon>["name"];
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [dirty, setDirty] = useState(false);
  const open = () => {
    setDirty(false);
    ref.current?.showModal();
  };
  const requestClose = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    ref.current?.close();
  };
  return (
    <>
      <button
        className={
          secondary
            ? "inline-flex min-h-[2.45rem] cursor-pointer items-center justify-center gap-2 rounded-prep-control border border-[#d9dadd] bg-white px-[0.9rem] py-[0.55rem] text-[0.75rem] font-[750] text-[#343a3f] hover:bg-[#f9fafb]"
            : "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-prep-control border border-prep-orange bg-prep-orange px-4 text-[0.75rem] font-[750] text-white hover:border-prep-orange-dark hover:bg-prep-orange-dark"
        }
        type="button"
        onClick={open}
      >
        {icon ? <UiIcon name={icon} /> : null}
        {label}
      </button>
      <dialog
        className={`fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[min(43rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#d5cdc4] bg-[#fbf8f4] p-0 shadow-[0_2rem_7rem_#0004] open:flex open:flex-col backdrop:bg-[#17120f91] backdrop:backdrop-blur-[5px] ${large ? "w-[min(64rem,calc(100vw-2rem))]" : ""}`}
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onInputCapture={() => setDirty(true)}
        onCancel={(event) => {
          event.preventDefault();
          requestClose();
        }}
        onClose={() => setDirty(false)}
        onClick={(event) => {
          if (event.target === ref.current) requestClose();
        }}
      >
        <header className="flex shrink-0 items-start justify-between border-b border-prep-line bg-white px-[1.35rem] py-[1.2rem] max-[600px]:p-4">
          <div>
            <h2 className="m-0 text-[1.1rem] tracking-[-0.035em]" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p
                className="mt-[0.35rem] mb-0 text-[0.82rem] leading-[1.45] text-[#73767b]"
                id={descriptionId}
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            className="grid size-9 cursor-pointer place-items-center rounded-[0.45rem] border border-[#cacac5] bg-white text-[#222] hover:bg-prep-orange-soft hover:text-prep-orange [&_svg]:size-4"
            type="button"
            aria-label={`Close ${title}`}
            onClick={requestClose}
          >
            <UiIcon name="close" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-[1.35rem] max-[600px]:p-4 [&_form_fieldset]:min-w-0">
          {children}
        </div>
      </dialog>
    </>
  );
}
