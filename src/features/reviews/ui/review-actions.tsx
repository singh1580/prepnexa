"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error?.message ?? "Couldn't complete this request.");
  return result.data as T;
}

export function StudentReviewForm({ productId, initial }: { productId: string; initial?: { rating: number; comment: string; feedback: string | null } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      await request("/api/reviews", { productId, rating: data.get("rating"), comment: data.get("comment"), feedback: data.get("feedback") });
      setMessage("Submitted for moderation. You can update it while it is being reviewed.");
      router.refresh();
    } catch (value) { setError(value instanceof Error ? value.message : "Couldn't submit your review."); }
    finally { setBusy(false); }
  }
  return <form className="student-review-form" onSubmit={submit}><fieldset disabled={busy}>
    <label className="field"><span>Rating</span><select name="rating" defaultValue={initial?.rating??5}><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></label>
    <label className="field"><span>Public review</span><textarea name="comment" defaultValue={initial?.comment} minLength={10} maxLength={1000} rows={4} required placeholder="What helped you, and what should another learner know?"/><small>This is published only after admin approval.</small></label>
    <label className="field"><span>Private feedback <small>(optional)</small></span><textarea name="feedback" defaultValue={initial?.feedback??""} maxLength={2000} rows={3} placeholder="Suggestions for Prepstore. This is never shown publicly."/></label>
    <button className="button" type="submit">{busy?"Submitting…":initial?"Update & resubmit":"Submit for review"}</button>
  </fieldset>{error?<p className="notice danger" role="alert">{error}</p>:null}{message?<p className="notice success" role="status">{message}</p>:null}</form>;
}

export function ReviewModerationActions({ reviewId, currentNote }: { reviewId: string; currentNote: string | null }) {
  const router=useRouter();const[busy,setBusy]=useState("");const[error,setError]=useState("");const[note,setNote]=useState(currentNote??"");
  async function moderate(status:"APPROVED"|"REJECTED") { setBusy(status);setError("");try{await request(`/api/admin/reviews/${reviewId}`,{status,note});router.refresh();}catch(value){setError(value instanceof Error?value.message:"Couldn't update this review.");}finally{setBusy("");} }
  return <div className="review-moderation-actions"><label><span>Moderator note <small>(shown to learner)</small></span><textarea value={note} onChange={event=>setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Optional approval note; give a reason when rejecting."/></label><div><button className="button small" disabled={Boolean(busy)} onClick={()=>moderate("APPROVED")}>{busy==="APPROVED"?"Approving…":"Approve"}</button><button className="button secondary small" disabled={Boolean(busy)} onClick={()=>moderate("REJECTED")}>{busy==="REJECTED"?"Rejecting…":"Reject"}</button></div>{error?<p className="notice danger" role="alert">{error}</p>:null}</div>;
}
