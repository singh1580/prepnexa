"use client";
import { useRef, type ReactNode } from "react";
export function AutoSubmitForm({children,className}:{children:ReactNode;className:string}){const ref=useRef<HTMLFormElement>(null);return <form ref={ref} className={className} action="/packages" onChange={()=>ref.current?.requestSubmit()}>{children}</form>}
