"use client";
/* Text includes intentional contractions. */
/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authRequest, ClientApiError } from "./api";
import { Field } from "./field";
import { MfaFlow } from "./mfa-flow";

export type AuthMode = "login" | "signup" | "forgot-password" | "reset-password" | "verify-email";
const copy: Record<AuthMode, { title: string; description: string; action: string }> = {
  login: { title: "Welcome back", description: "Sign in to continue your preparation.", action: "Sign in" },
  signup: { title: "Create your account", description: "A fresh start for your exam preparation.", action: "Create account" },
  "forgot-password": { title: "Forgot your password?", description: "Enter your email and we'll send a reset link if your account is eligible.", action: "Send reset link" },
  "reset-password": { title: "Choose a new password", description: "Use a unique password you haven't used elsewhere.", action: "Reset password" },
  "verify-email": { title: "Verify your email", description: "Confirm your email address to activate your account.", action: "Verify email" },
};

export function AuthForm({ mode, token, expiredSession = false, nextPath = "/dashboard" }: { mode: AuthMode; token?: string; expiredSession?: boolean; nextPath?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invalidLink, setInvalidLink] = useState(false);
  const [done, setDone] = useState(false);
  const [challenge, setChallenge] = useState<{ token: string; setup: boolean } | null>(null);
  const c = copy[mode];
  const hasPassword = mode === "login" || mode === "signup" || mode === "reset-password";
  const hasEmail = mode !== "reset-password" && (mode !== "verify-email" || !token || invalidLink);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError(""); setMessage("");
    if (mode === "reset-password" && values.password !== values.confirmPassword) { setError("The passwords don't match. Please try again."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const result = await authRequest<{ mfaRequired: boolean; mfaSetupRequired?: boolean; challengeToken?: string }>("login", values);
        if (result.mfaRequired && result.challengeToken) setChallenge({ token: result.challengeToken, setup: Boolean(result.mfaSetupRequired) });
        else router.push(nextPath);
      } else if (mode === "signup") {
        const result = await authRequest<{ emailSent: boolean }>("register", values);
        setMessage(result.emailSent ? "Account created. Check your inbox for the verification link before signing in." : "Account created, but we couldn't send the verification email. Try resending it below; contact your administrator if delivery remains unavailable."); setDone(true);
      } else if (mode === "forgot-password") {
        await authRequest("request-password-reset", values); setMessage("If your account is eligible, a reset link will arrive shortly. Check your inbox and spam folder."); setDone(true);
      } else if (mode === "reset-password") {
        await authRequest("reset-password", { token, password: values.password }); setMessage("Password updated. Your previous sessions have been signed out."); setDone(true);
      } else if (token && !invalidLink) {
        await authRequest("verify-email", { token }); setMessage("Email verified. You can now sign in."); setDone(true);
      } else {
        await authRequest("resend-verification", values); setMessage("If your account needs verification, a new link will be sent. Check your inbox and spam folder."); setDone(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      if (e instanceof ClientApiError && e.code === "INVALID_OR_EXPIRED_TOKEN") setInvalidLink(true);
    } finally { setBusy(false); }
  }

  if (challenge) return <MfaFlow challengeToken={challenge.token} setup={challenge.setup} nextPath={nextPath} onBack={() => { setChallenge(null); setError(""); }} />;
  if (mode === "reset-password" && (!token || invalidLink)) return <><span className="eyebrow">ACCOUNT RECOVERY</span><h1>This link isn't available</h1><p className="muted">It may have expired or already been used. Request a new password reset link.</p><Link className="button" href="/forgot-password">Request a new link</Link><Link className="text-link" href="/login">Back to sign in</Link></>;
  return <><span className="eyebrow">{mode === "login" ? "GOOD TO SEE YOU AGAIN" : "YOUR ACCOUNT"}</span><h1>{done ? "You're one step closer" : c.title}</h1><p className="muted">{!done && c.description}</p>{expiredSession && <p className="notice">Please sign in again to continue securely.</p>}{error && <div className="notice danger" role="alert">{error}</div>}{message && <div className="notice success" role="status">{message}</div>}{!done && <form onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>{mode === "signup" && <Field label="Full name" name="name" autoComplete="name" required minLength={2} maxLength={120} />}{hasEmail && <Field label="Email address" name="email" type="email" autoComplete="email" required maxLength={320} placeholder="you@example.com" />}{hasPassword && <Field label={mode === "reset-password" ? "New password" : "Password"} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={10} maxLength={128} hint={mode === "login" ? undefined : "Use 10–128 characters. A long, unique passphrase works well."} />}{mode === "reset-password" && <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />}{mode === "login" && <div className="form-right"><Link href="/forgot-password">Forgot password?</Link></div>}<button className="button full" type="submit">{busy ? "Please wait…" : mode === "verify-email" && (!token || invalidLink) ? "Resend verification email" : c.action}</button></fieldset></form>}{mode === "login" && <><p className="form-switch">New here? <Link href="/signup">Create an account</Link></p><Link className="text-link subtle" href="/verify-email">Need a new verification email?</Link></>}{mode !== "login" && <Link className="text-link" href="/login">Back to sign in</Link>}{done && mode === "signup" && <Link className="text-link" href="/verify-email">Resend verification email</Link>}</>;
}
