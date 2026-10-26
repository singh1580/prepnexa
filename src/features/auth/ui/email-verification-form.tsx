"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { authRequest } from "./api";
import {
  authButton,
  authDangerNotice,
  authEyebrow,
  authField,
  authFieldset,
  authInput,
  authLabel,
  authMuted,
  authNotice,
  authSuccessNotice,
  authTextLink,
} from "./auth-styles";

const normalizeCode = (value: string) => value.replace(/\D/g, "").slice(0, 6);

export function EmailVerificationForm({
  initialEmail = "",
  deliveryFailed = false,
  expiresInMinutes,
}: {
  initialEmail?: string;
  deliveryFailed?: boolean;
  expiresInMinutes: number;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    deliveryFailed
      ? "Your account was created, but the first code could not be delivered. You can request another code when the resend timer ends."
      : initialEmail
        ? "We sent a 6-digit code to your email address."
        : "Enter your account email to request a verification code.",
  );
  const [retryAfter, setRetryAfter] = useState(initialEmail ? 60 : 0);
  const submittedCode = useRef("");

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(
      () => setRetryAfter((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  const verify = useCallback(
    async (nextCode: string) => {
      if (
        !email ||
        nextCode.length !== 6 ||
        busy ||
        submittedCode.current === nextCode
      )
        return;
      submittedCode.current = nextCode;
      setBusy(true);
      setError("");
      try {
        await authRequest("verify-email", { email, code: nextCode });
        setVerified(true);
        setMessage(
          "Email verified successfully. Your Prepstore account is ready.",
        );
      } catch (value) {
        setError(
          value instanceof Error
            ? value.message
            : "We couldn't verify this code.",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, email],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verify(code);
  }

  async function resend() {
    if (!email || busy || retryAfter > 0) return;
    setBusy(true);
    setError("");
    try {
      const result = await authRequest<{ retryAfterSeconds: number }>(
        "resend-verification",
        { email },
      );
      setCode("");
      submittedCode.current = "";
      setRetryAfter(result.retryAfterSeconds);
      setMessage(
        "Request accepted. If this account still needs verification, a fresh code will arrive shortly. Check your inbox and spam folder.",
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "We couldn't request another code.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (verified)
    return (
      <>
        <span className={authEyebrow}>EMAIL VERIFIED</span>
        <h1>Account activated</h1>
        <div className={`${authNotice} ${authSuccessNotice}`} role="status">
          {message}
        </div>
        <Link className={`${authButton} w-full`} href="/login">
          Continue to sign in
        </Link>
      </>
    );

  return (
    <>
      <span className={authEyebrow}>SECURE VERIFICATION</span>
      <h1>Check your email</h1>
      <p className={authMuted}>
        Enter the one-time code to activate your account. It expires in{" "}
        {expiresInMinutes} minutes.
      </p>
      {error ? (
        <div className={`${authNotice} ${authDangerNotice}`} role="alert">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className={authNotice} role="status">
          {message}
        </div>
      ) : null}
      <form className="mt-[1.7rem]" onSubmit={submit} aria-busy={busy}>
        <fieldset className={authFieldset} disabled={busy}>
          <label className={authField}>
            <span className={authLabel}>Email address</span>
            <input
              className={authInput}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.trim().toLowerCase());
                setCode("");
                submittedCode.current = "";
              }}
              placeholder="you@example.com"
            />
          </label>
          <label className={authField}>
            <span className={authLabel}>6-digit verification code</span>
            <input
              className={`${authInput} text-center font-mono text-[1.35rem] font-bold tracking-[0.32em] tabular-nums`}
              value={code}
              onChange={(event) => {
                const next = normalizeCode(event.target.value);
                setCode(next);
                submittedCode.current = "";
                if (next.length === 6) void verify(next);
              }}
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              maxLength={6}
              required
              placeholder="000000"
              aria-describedby="otp-help"
            />
            <small
              className="text-[0.79rem] leading-[1.4] text-prep-muted"
              id="otp-help"
            >
              Verification starts automatically when all 6 digits are entered.
            </small>
          </label>
          <button
            className={`${authButton} w-full`}
            type="submit"
            disabled={code.length !== 6}
          >
            {busy ? "Verifying…" : "Verify email"}
          </button>
        </fieldset>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[0.82rem] text-[#6f6862]">
        <span>Didn&apos;t receive it?</span>
        <button
          className="min-h-11 font-bold text-[#c83d11] hover:underline disabled:text-[#918b86] disabled:no-underline"
          type="button"
          onClick={resend}
          disabled={busy || !email || retryAfter > 0}
        >
          {retryAfter > 0 ? `Resend in ${retryAfter}s` : "Send a new code"}
        </button>
      </div>
      <Link className={`${authTextLink} w-full`} href="/login">
        Back to sign in
      </Link>
    </>
  );
}
