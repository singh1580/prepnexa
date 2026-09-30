"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiFailure } from "@/lib/http/api-response";

export function AdminDeleteButton({ endpoint, redirectTo, label, confirmation }: { endpoint: string; redirectTo: string; label: string; confirmation: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(confirmation)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE", credentials: "same-origin" });
      const payload = await response.json() as ApiFailure | { data: unknown };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error.message : "Delete failed.");
      router.push(redirectTo); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Delete failed."); }
    finally { setBusy(false); }
  }
  return <div className="danger-zone"><button className="button danger" type="button" disabled={busy} onClick={() => void remove()}>{busy ? "Deleting…" : label}</button>{error && <p className="notice danger" role="alert">{error}</p>}</div>;
}
