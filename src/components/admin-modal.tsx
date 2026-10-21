"use client";
import { useId, useRef, useState } from "react";
import { UiIcon } from "./ui-icon";
export function AdminModal({label,title,description,large=false,secondary=false,icon,children}:{label:string;title:string;description?:string;large?:boolean;secondary?:boolean;icon?:React.ComponentProps<typeof UiIcon>["name"];children:React.ReactNode}) {
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
  return <>
    <button className={secondary?"button secondary small":"button admin-primary"} type="button" onClick={open}>{icon?<UiIcon name={icon}/>:null}{label}</button>
    <dialog
      className={large?"admin-dialog dialog-large":"admin-dialog"}
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onInputCapture={() => setDirty(true)}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClose={() => setDirty(false)}
      onClick={(event) => { if(event.target===ref.current) requestClose(); }}
    >
      <header className="dialog-heading"><div><h2 id={titleId}>{title}</h2>{description?<p id={descriptionId}>{description}</p>:null}</div><button className="icon-button" type="button" aria-label={`Close ${title}`} onClick={requestClose}><UiIcon name="close" /></button></header>
      <div className="dialog-body">{children}</div>
    </dialog>
  </>;
}
