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
export function ProfileForm({ name, email, phone, verified }: { name: string; email: string; phone:string|null; verified: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { await authRequest("profile", Object.fromEntries(new FormData(e.currentTarget))); setMessage("Your profile has been updated."); router.refresh(); }
    catch(e) { if(e instanceof ClientApiError && e.code === "UNAUTHENTICATED") router.push("/login?reason=session"); else setError(e instanceof Error ? e.message : "Couldn't save changes."); }
    finally { setBusy(false); }
  }
  return <form className="profile-form" onSubmit={submit}><fieldset disabled={busy}><div className="profile-form-grid"><Field label="Full name" name="name" defaultValue={name} autoComplete="name" required minLength={2} maxLength={120} /><Field label="Phone number" name="phone" defaultValue={phone??""} autoComplete="tel" minLength={7} maxLength={20} /></div><Field label="Email address" name="email" value={email} readOnly hint={verified ? "Verified email. Email changes aren't available here." : "Email verification is pending."} /><button className="button">{busy ? "Saving…" : "Save changes"}</button></fieldset>{message && <p className="notice success" role="status">{message}</p>}{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

export function ChangePasswordForm(){const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");const[error,setError]=useState("");async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setMessage("");setError("");const form=event.currentTarget;const data=new FormData(form);if(data.get("newPassword")!==data.get("confirmPassword")){setError("New passwords do not match.");setBusy(false);return;}try{await authRequest("change-password",{currentPassword:data.get("currentPassword"),newPassword:data.get("newPassword")});form.reset();setMessage("Password updated. Other signed-in sessions were revoked.");}catch(value){setError(value instanceof Error?value.message:"Could not update password.");}finally{setBusy(false);}}return <form className="change-password-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required minLength={10}/><Field label="New password" name="newPassword" type="password" autoComplete="new-password" required minLength={10}/><Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10}/><button className="button" type="submit">{busy?"Updating…":"Update password"}</button></fieldset>{message?<p className="notice success" role="status">{message}</p>:null}{error?<p className="notice danger" role="alert">{error}</p>:null}</form>}
