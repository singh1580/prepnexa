"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authRequest, ClientApiError } from "@/features/auth/ui/api";
import { Field } from "@/features/auth/ui/field";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  return <><button className="button secondary" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try { await authRequest("logout", {}); router.push("/login"); router.refresh(); }
    catch { setError("Couldn't sign out. Please try again."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert">{error}</p>}</>;
}
export function ProfileForm({ name, email, verified }: { name: string; email: string; verified: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { await authRequest("profile", Object.fromEntries(new FormData(e.currentTarget))); setMessage("Your profile has been updated."); router.refresh(); }
    catch(e) { if(e instanceof ClientApiError && e.code === "UNAUTHENTICATED") router.push("/login?reason=session"); else setError(e instanceof Error ? e.message : "Couldn't save changes."); }
    finally { setBusy(false); }
  }
  return <form className="profile-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Full name" name="name" defaultValue={name} autoComplete="name" required minLength={2} maxLength={120} /><Field label="Email address" name="email" value={email} readOnly hint={verified ? "Verified email. Email changes aren't available here." : "Email verification is pending."} /><button className="button">{busy ? "Saving…" : "Save changes"}</button></fieldset>{message && <p className="notice success" role="status">{message}</p>}{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}
