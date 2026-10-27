"use client";
import { useState, type InputHTMLAttributes } from "react";
import { authField, authInput, authLabel } from "./auth-styles";

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  const id = props.id ?? props.name;
  const password = props.type === "password";
  return (
    <div className={authField}>
      <label className={authLabel} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`${authInput}${password ? " pr-16" : ""}`}
          id={id}
          type={password && visible ? "text" : props.type}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {password && (
          <button
            className="absolute inset-y-0 right-0 flex min-h-11 items-center px-3 text-[0.76rem] font-bold text-[#6f6862] transition-colors hover:text-prep-orange focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-prep-orange"
            type="button"
            aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && (
        <small
          className="text-[0.79rem] leading-[1.4] text-prep-muted"
          id={`${id}-hint`}
        >
          {hint}
        </small>
      )}
    </div>
  );
}
