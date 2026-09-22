"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

export function StartAttemptButton({ testId, activeAttemptId, disabled = false }: { testId: string; activeAttemptId: string | null; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (activeAttemptId) { router.push(`/attempts/${activeAttemptId}`); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tests/${testId}/attempts`, { method: "POST", credentials: "same-origin" });
      const payload = await response.json() as ApiSuccess<{ id: string }> | ApiFailure;
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error.message : "Couldn't start this test.");
      router.push(`/attempts/${payload.data.id}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Couldn't start this test."); }
    finally { setBusy(false); }
  }
  return <div className="start-attempt-action"><button className="button full" type="button" disabled={disabled || busy} onClick={start}>{busy ? "Preparing your paper…" : activeAttemptId ? "Resume attempt" : "Start test"}</button>{error && <p className="notice danger" role="alert">{error}</p>}</div>;
}
