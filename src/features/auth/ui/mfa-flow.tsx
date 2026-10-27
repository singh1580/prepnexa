"use client";
/* Text includes intentional contractions. */
/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import { useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { authRequest } from "./api";
import { Field } from "./field";
import {
  authButton,
  authDangerNotice,
  authEyebrow,
  authFieldset,
  authMuted,
  authNotice,
  authSecondaryButton,
  authTextLink,
} from "./auth-styles";

export function MfaFlow({
  challengeToken,
  setup,
  nextPath = "/dashboard",
  onBack,
}: {
  challengeToken: string;
  setup: boolean;
  nextPath?: string;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [factor, setFactor] = useState<{ secret: string; qr: string } | null>(
    null,
  );
  const [recovery, setRecovery] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  async function begin() {
    setBusy(true);
    setError("");
    try {
      const result = await authRequest<{ secret: string; uri: string }>(
        "mfa/enroll",
        { challengeToken },
      );
      setFactor({
        secret: result.secret,
        qr: await QRCode.toDataURL(result.uri, { margin: 2, width: 224 }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start setup.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (setup) {
        const result = await authRequest<{ recoveryCodes: string[] }>(
          "mfa/enroll-confirm",
          { challengeToken, ...values },
        );
        setCodes(result.recoveryCodes);
        setFactor(null);
      } else {
        await authRequest("mfa/verify-login", { challengeToken, ...values });
        window.location.replace(nextPath);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([codes.join("\n")], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "account-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (codes.length)
    return (
      <>
        <span className={authEyebrow}>KEEP THESE SAFE</span>
        <h1>Your recovery codes</h1>
        <p className={authMuted}>
          Each code works once if you lose your authenticator. Save them
          somewhere private. They won't be shown again.
        </p>
        <div className="my-5 grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
          {codes.map((code) => (
            <code
              className="rounded-prep-control border border-[#ded6ce] bg-[#f8f5f1] px-3 py-2 text-center text-[0.8rem]"
              key={code}
            >
              {code}
            </code>
          ))}
        </div>
        <button
          className={`${authButton} ${authSecondaryButton} w-full`}
          onClick={download}
        >
          Download recovery codes
        </button>
        <label className="my-3 flex min-h-11 items-center gap-2 text-[0.82rem] text-[#5f676f]">
          <input
            className="size-4 accent-prep-orange"
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
          />
          I have saved my recovery codes
        </label>
        <button
          className={`${authButton} w-full`}
          disabled={!saved}
          onClick={() => {
            setCodes([]);
            onBack();
          }}
        >
          Continue to sign in
        </button>
      </>
    );
  return (
    <>
      <span className={authEyebrow}>PROTECT YOUR ACCOUNT</span>
      <h1>
        {setup
          ? "Set up two-factor authentication"
          : recovery
            ? "Use a recovery code"
            : "One more security check"}
      </h1>
      <p className={authMuted}>
        {setup
          ? "Administrator accounts need an authenticator before accessing their workspace."
          : recovery
            ? "Enter one of your unused recovery codes."
            : "Enter the six-digit code from your authenticator app."}
      </p>
      {error && (
        <p className={`${authNotice} ${authDangerNotice}`} role="alert">
          {error}
        </p>
      )}
      {setup && !factor ? (
        <button
          className={`${authButton} mt-6 w-full`}
          disabled={busy}
          onClick={begin}
        >
          {busy ? "Preparing…" : "Set up authenticator"}
        </button>
      ) : (
        <form className="mt-[1.7rem]" onSubmit={submit}>
          <fieldset className={authFieldset} disabled={busy}>
            {factor && (
              <>
                <Image
                  className="mx-auto size-56 max-w-full rounded-prep-control border border-[#ded6ce]"
                  src={factor.qr}
                  width={224}
                  height={224}
                  alt="Scan this QR code in your authenticator app"
                  unoptimized
                />
                <p className={authMuted}>
                  Scan the QR code, or enter this setup key manually:
                </p>
                <code className="rounded-prep-control border border-[#ded6ce] bg-[#f8f5f1] px-3 py-2 text-center text-[0.78rem] [overflow-wrap:anywhere]">
                  {factor.secret}
                </code>
              </>
            )}
            {recovery ? (
              <Field
                key="recovery"
                label="Recovery code"
                name="recoveryCode"
                required
                autoComplete="off"
                minLength={13}
                maxLength={20}
              />
            ) : (
              <Field
                key="otp"
                label="Authenticator code"
                name="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                placeholder="000000"
              />
            )}
            <button className={`${authButton} w-full`}>
              {busy
                ? "Verifying…"
                : setup
                  ? "Enable two-factor authentication"
                  : "Verify and continue"}
            </button>
          </fieldset>
        </form>
      )}
      {!setup && (
        <button
          className={`${authTextLink} mt-3 w-full`}
          onClick={() => {
            setRecovery(!recovery);
            setError("");
          }}
        >
          {recovery
            ? "Use authenticator instead"
            : "Use a recovery code instead"}
        </button>
      )}
      <button
        className={`${authTextLink} w-full text-[#6f6862]`}
        onClick={onBack}
        disabled={busy}
      >
        Back to sign in
      </button>
    </>
  );
}
