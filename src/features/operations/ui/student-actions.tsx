"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { operationsRequest, OperationsApiError } from "./api";

function message(error: unknown) { return error instanceof OperationsApiError ? error.message : "Couldn't complete this request."; }

export function SessionList({ sessions }: { sessions: { id: string; userAgent: string | null; createdAt: Date; expiresAt: Date; current: boolean }[] }) {
  const router = useRouter(); const [busy, setBusy] = useState(""); const [error, setError] = useState("");
  return <div className="security-list">{sessions.map((session) => <section className="panel security-row" key={session.id}><span className="security-icon" aria-hidden="true">□</span><div><h2>{session.current ? "Current session" : deviceName(session.userAgent)}</h2><p>Signed in {new Date(session.createdAt).toLocaleString("en-IN")} · expires {new Date(session.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div>{session.current ? <span className="status-pill">This device</span> : <button className="button secondary" disabled={busy === session.id} onClick={async () => { setBusy(session.id); setError(""); try { await operationsRequest(`sessions/${session.id}`, undefined, "DELETE"); router.refresh(); } catch (value) { setError(message(value)); } finally { setBusy(""); } }}>{busy === session.id ? "Revoking…" : "Revoke"}</button>}</section>)}{error && <p className="notice danger" role="alert">{error}</p>}</div>;
}

export function NotificationActions({ unreadIds }: { unreadIds: string[] }) {
  const router = useRouter(); const [busy, setBusy] = useState(""); const [error, setError] = useState("");
  async function act(path: string) { setBusy(path); setError(""); try { await operationsRequest(path); router.refresh(); } catch (value) { setError(message(value)); } finally { setBusy(""); } }
  if (!unreadIds.length) return null;
  return <div className="notification-actions"><button className="button secondary" disabled={Boolean(busy)} onClick={() => act("notifications/read-all")}>{busy ? "Updating…" : "Mark all as read"}</button>{error && <p className="notice danger" role="alert">{error}</p>}</div>;
}

export function NotificationReadButton({ id }: { id: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  return <button className="text-button" disabled={busy} onClick={async () => { setBusy(true); try { await operationsRequest(`notifications/${id}/read`); router.refresh(); } finally { setBusy(false); } }}>{busy ? "Updating…" : "Mark read"}</button>;
}

export function NewSupportTicketForm({ orders }: { orders: { id: string; label: string }[] }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form = event.currentTarget; const data = new FormData(form); try { const result = await operationsRequest<{ id: string }>("support", { subject: data.get("subject"), category: data.get("category"), orderId: data.get("orderId") || null, message: data.get("message") }); router.push(`/dashboard/support/${result.id}`); router.refresh(); } catch (value) { setError(message(value)); setBusy(false); } }
  return <form className="admin-form" onSubmit={submit}><fieldset disabled={busy}><label className="field"><span>Category</span><select name="category" defaultValue="ACCOUNT"><option value="ACCOUNT">Account</option><option value="PAYMENT">Payment or order</option><option value="TEST">Mock test</option><option value="MATERIAL">Study material</option><option value="OTHER">Other</option></select></label><label className="field"><span>Related order (optional)</span><select name="orderId" defaultValue=""><option value="">No related order</option>{orders.map((order) => <option value={order.id} key={order.id}>{order.label}</option>)}</select></label><label className="field"><span>Subject</span><input name="subject" minLength={5} maxLength={200} required /></label><label className="field"><span>How can we help?</span><textarea name="message" minLength={5} maxLength={4000} rows={6} required /></label><button className="button" type="submit">{busy ? "Creating…" : "Create support ticket"}</button></fieldset>{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

export function SupportReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form = event.currentTarget; const data = new FormData(form); try { await operationsRequest(`support/${ticketId}/messages`, { body: data.get("body") }); form.reset(); router.refresh(); } catch (value) { setError(message(value)); } finally { setBusy(false); } }
  return <form className="admin-form support-reply" onSubmit={submit}><fieldset disabled={busy}><label className="field"><span>Reply</span><textarea name="body" minLength={2} maxLength={4000} rows={4} required /></label><button className="button" type="submit">{busy ? "Sending…" : "Send reply"}</button></fieldset>{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

function deviceName(userAgent: string | null) {
  if (!userAgent) return "Signed-in device";
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const system = /Windows/.test(userAgent) ? "Windows" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Mac OS/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : "device";
  return `${browser} on ${system}`;
}
