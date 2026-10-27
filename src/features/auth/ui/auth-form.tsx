"use client";
/* Text includes intentional contractions. */
/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authRequest, ClientApiError } from "./api";
import { Field } from "./field";
import { MfaFlow } from "./mfa-flow";
import {
  authButton,
  authDangerNotice,
  authEyebrow,
  authFieldset,
  authMuted,
  authNotice,
  authSuccessNotice,
  authTextLink,
} from "./auth-styles";

export type AuthMode =
  "login" | "signup" | "forgot-password" | "reset-password";
const copy: Record<
  AuthMode,
  { title: string; description: string; action: string }
> = {
  login: {
    title: "Welcome back",
    description: "Sign in to continue your preparation.",
    action: "Sign in",
  },
  signup: {
    title: "Create your account",
    description: "A fresh start for your exam preparation.",
    action: "Create account",
  },
  "forgot-password": {
    title: "Forgot your password?",
    description:
      "Enter your email and we'll send a reset link if your account is eligible.",
    action: "Send reset link",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Use a unique password you haven't used elsewhere.",
    action: "Reset password",
  },
};

export function AuthForm({
  mode,
  token,
  expiredSession = false,
  nextPath = "/dashboard",
}: {
  mode: AuthMode;
  token?: string;
  expiredSession?: boolean;
  nextPath?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invalidLink, setInvalidLink] = useState(false);
  const [done, setDone] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [challenge, setChallenge] = useState<{
    token: string;
    setup: boolean;
  } | null>(null);
  const c = copy[mode];
  const hasPassword =
    mode === "login" || mode === "signup" || mode === "reset-password";
  const hasEmail = mode !== "reset-password";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    setMessage("");
    setVerificationEmail("");
    if (
      mode === "reset-password" &&
      values.password !== values.confirmPassword
    ) {
      setError("The passwords don't match. Please try again.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const result = await authRequest<{
          mfaRequired: boolean;
          mfaSetupRequired?: boolean;
          challengeToken?: string;
        }>("login", values);
        if (result.mfaRequired && result.challengeToken)
          setChallenge({
            token: result.challengeToken,
            setup: Boolean(result.mfaSetupRequired),
          });
        else window.location.replace(nextPath);
      } else if (mode === "signup") {
        const result = await authRequest<{
          user: { email: string };
          emailSent: boolean;
        }>("register", values);
        window.location.replace(
          `/verify-email?email=${encodeURIComponent(result.user.email)}${result.emailSent ? "" : "&delivery=failed"}`,
        );
      } else if (mode === "forgot-password") {
        await authRequest("request-password-reset", values);
        setMessage(
          "If your account is eligible, a reset link will arrive shortly. Check your inbox and spam folder.",
        );
        setDone(true);
      } else if (mode === "reset-password") {
        await authRequest("reset-password", {
          token,
          password: values.password,
        });
        setMessage(
          "Password updated. Your previous sessions have been signed out.",
        );
        setDone(true);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
      if (e instanceof ClientApiError && e.code === "INVALID_OR_EXPIRED_TOKEN")
        setInvalidLink(true);
      if (
        e instanceof ClientApiError &&
        e.code === "EMAIL_NOT_VERIFIED" &&
        typeof values.email === "string" &&
        values.email.includes("@")
      )
        setVerificationEmail(values.email);
    } finally {
      setBusy(false);
    }
  }

  if (challenge)
    return (
      <MfaFlow
        challengeToken={challenge.token}
        setup={challenge.setup}
        nextPath={nextPath}
        onBack={() => {
          setChallenge(null);
          setError("");
        }}
      />
    );
  if (mode === "reset-password" && (!token || invalidLink))
    return (
      <>
        <span className={authEyebrow}>ACCOUNT RECOVERY</span>
        <h1>This link isn't available</h1>
        <p className={authMuted}>
          It may have expired or already been used. Request a new password reset
          link.
        </p>
        <div className="mt-6 grid gap-2">
          <Link className={authButton} href="/forgot-password">
            Request a new link
          </Link>
          <Link className={authTextLink} href="/login">
            Back to sign in
          </Link>
        </div>
      </>
    );
  const doneTitle =
    mode === "forgot-password" ? "Check your email" : "You're one step closer";
  return (
    <>
      <h1>{done ? doneTitle : c.title}</h1>
      <p className={authMuted}>{!done && c.description}</p>
      {expiredSession && (
        <p className={authNotice}>Please sign in again to continue securely.</p>
      )}
      {error && (
        <div className={`${authNotice} ${authDangerNotice}`} role="alert">
          {error}
          {verificationEmail ? (
            <>
              <br />
              <Link
                className="font-bold underline underline-offset-2"
                href={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}
              >
                Enter or resend verification code
              </Link>
            </>
          ) : null}
        </div>
      )}
      {message && (
        <div className={`${authNotice} ${authSuccessNotice}`} role="status">
          {message}
        </div>
      )}
      {!done && (
        <form onSubmit={submit} aria-busy={busy}>
          <fieldset className={authFieldset} disabled={busy}>
            {mode === "signup" && (
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
              />
            )}
            {hasEmail && (
              <Field
                label={
                  mode === "login" ? "Email or phone number" : "Email address"
                }
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                placeholder="you@example.com"
              />
            )}
            {hasPassword && (
              <Field
                label={
                  mode === "reset-password"
                    ? "New password"
                    : mode === "signup"
                      ? "Create password"
                      : "Password"
                }
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={10}
                maxLength={128}
              />
            )}
            {mode === "signup" ? (
              <ul
                className="grid gap-1 text-[0.76rem] text-[#626a70]"
                aria-label="Password guidance"
              >
                <li className="flex items-center gap-[0.45rem] before:size-1 before:shrink-0 before:rounded-full before:bg-prep-orange">
                  At least 10 characters
                </li>
                <li className="flex items-center gap-[0.45rem] before:size-1 before:shrink-0 before:rounded-full before:bg-prep-orange">
                  Use a unique password
                </li>
                <li className="flex items-center gap-[0.45rem] before:size-1 before:shrink-0 before:rounded-full before:bg-prep-orange">
                  A long passphrase works best
                </li>
              </ul>
            ) : null}
            {mode === "reset-password" && (
              <Field
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={128}
              />
            )}
            {mode === "signup" && (
              <label className="grid grid-cols-[auto_1fr] items-start gap-[0.65rem] text-[0.72rem] leading-[1.55] text-[#5f676f] [&_a]:font-bold [&_a]:text-[#c83d11] [&_a]:underline [&_a]:underline-offset-2">
                <input
                  className="mt-[0.18rem] size-4 accent-prep-orange"
                  type="checkbox"
                  name="acceptPolicies"
                  value="true"
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link href="/legal/terms" target="_blank">
                    Terms of service
                  </Link>
                  ,{" "}
                  <Link href="/legal/privacy" target="_blank">
                    Privacy policy
                  </Link>
                  ,{" "}
                  <Link href="/legal/cancellation-refund" target="_blank">
                    Cancellation &amp; refund policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/fair-use" target="_blank">
                    Fair use policy
                  </Link>
                  .
                </span>
              </label>
            )}
            {mode === "login" && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-[0.82rem] text-[#5f676f] [&_a]:font-bold [&_a]:text-[#c83d11] [&_a]:hover:underline [&_input]:size-4 [&_input]:accent-prep-orange">
                <label className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" name="remember" /> Keep me signed in on
                  this device
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}
            <button className={`${authButton} w-full`} type="submit">
              {busy ? "Please wait…" : c.action}
            </button>
          </fieldset>
        </form>
      )}
      {mode === "login" && (
        <p className="mt-5 text-center text-[0.82rem] text-[#6f6862] [&_a]:font-bold [&_a]:text-[#c83d11] [&_a]:hover:underline">
          Don&apos;t have an account? <Link href="/signup">Create account</Link>
        </p>
      )}
      {mode !== "login" && (
        <Link className={`${authTextLink} mt-3 w-full`} href="/login">
          Back to sign in
        </Link>
      )}
    </>
  );
}
