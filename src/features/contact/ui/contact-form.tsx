"use client";

import { useState, type FormEvent } from "react";

type ApiResult = { data?: { reference: string | null }; error?: { message?: string } };

export function ContactForm({ defaultName = "", defaultEmail = "", defaultPhone = "" }: { defaultName?: string; defaultEmail?: string; defaultPhone?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.error?.message || "We could not submit your enquiry. Please try again.");
      setSuccess(result.data?.reference
        ? `Your enquiry has been received. Reference: ${result.data.reference}`
        : "Your enquiry has been received.");
      form.reset();
    } catch (value) {
      setError(value instanceof Error ? value.message : "We could not submit your enquiry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} aria-busy={busy}>
    <fieldset disabled={busy}>
      <div className="contact-form-row">
        <label><span>Full name</span><input name="name" autoComplete="name" defaultValue={defaultName} minLength={2} maxLength={120} required /></label>
        <label><span>Email address</span><input name="email" type="email" autoComplete="email" defaultValue={defaultEmail} maxLength={320} required /></label>
      </div>
      <div className="contact-form-row">
        <label><span>Phone <small>Optional</small></span><input name="phone" type="tel" autoComplete="tel" defaultValue={defaultPhone ?? ""} maxLength={20} /></label>
        <label><span>Enquiry type</span><select name="category" defaultValue="GENERAL" required><option value="GENERAL">General enquiry</option><option value="BUSINESS">Business or institution</option><option value="CONTENT_PERMISSION">Content permission</option><option value="PRIVACY">Privacy request</option><option value="GRIEVANCE">Formal grievance</option></select></label>
      </div>
      <label><span>Subject</span><input name="subject" minLength={5} maxLength={180} required /></label>
      <label><span>How can we help?</span><textarea name="message" rows={6} minLength={20} maxLength={5000} required /></label>
      <label className="contact-form-honeypot" aria-hidden="true"><span>Website</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="contact-form-submit"><p>Do not include passwords, OTPs, UPI PINs, CVV or full card details.</p><button type="submit">{busy ? "Sending…" : "Send enquiry"}</button></div>
    </fieldset>
    {error ? <p className="contact-form-status error" role="alert">{error}</p> : null}
    {success ? <p className="contact-form-status success" role="status">{success}</p> : null}
  </form>;
}

