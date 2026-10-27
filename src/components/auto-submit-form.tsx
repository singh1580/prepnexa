"use client";
import { useRef, type ReactNode } from "react";
export function AutoSubmitForm({children,className}:{children:ReactNode;className:string}) {
  const ref=useRef<HTMLFormElement>(null);
  return <form ref={ref} className={className} action="/packages" onChange={(event) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
    if (control instanceof HTMLSelectElement || ["checkbox", "radio"].includes(control.type)) {
      ref.current?.requestSubmit();
    }
  }}>{children}</form>;
}
