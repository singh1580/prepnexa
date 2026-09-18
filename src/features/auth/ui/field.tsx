"use client";
import { useState, type InputHTMLAttributes } from "react";

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  const id = props.id ?? props.name;
  const password = props.type === "password";
  return <div className="field"><label htmlFor={id}>{label}</label><div className="input-wrap"><input {...props} id={id} type={password && visible ? "text" : props.type} aria-describedby={hint ? `${id}-hint` : undefined} />{password && <button className="reveal" type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Hide" : "Show"}</button>}</div>{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
