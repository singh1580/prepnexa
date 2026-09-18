"use client";
/* Text includes intentional contractions. */
/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import { useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { authRequest } from "./api";
import { Field } from "./field";

export function MfaFlow({ challengeToken, setup, onBack }: { challengeToken: string; setup: boolean; onBack: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [factor, setFactor] = useState<{ secret: string; qr: string } | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  async function begin() {
    setBusy(true); setError("");
    try {
      const result = await authRequest<{ secret: string; uri: string }>("mfa/enroll", { challengeToken });
      setFactor({ secret: result.secret, qr: await QRCode.toDataURL(result.uri, { margin: 2, width: 224 }) });
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't start setup."); }
    finally { setBusy(false); }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (setup) {
        const result = await authRequest<{ recoveryCodes: string[] }>("mfa/enroll-confirm", { challengeToken, ...values });
        setCodes(result.recoveryCodes); setFactor(null);
      } else {
        await authRequest("mfa/verify-login", { challengeToken, ...values });
        router.push("/dashboard"); router.refresh();
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Verification failed."); }
    finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([codes.join("\n")], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url; a.download = "account-recovery-codes.txt"; a.click(); URL.revokeObjectURL(url);
  }
  if (codes.length) return <><span className="eyebrow">KEEP THESE SAFE</span><h1>Your recovery codes</h1><p className="muted">Each code works once if you lose your authenticator. Save them somewhere private. They won't be shown again.</p><div className="recovery-grid">{codes.map(code => <code key={code}>{code}</code>)}</div><button className="button secondary full" onClick={download}>Download recovery codes</button><label className="check-row"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} />I have saved my recovery codes</label><button className="button full" disabled={!saved} onClick={() => { setCodes([]); onBack(); }}>Continue to sign in</button></>;
  return <><span className="eyebrow">PROTECT YOUR ACCOUNT</span><h1>{setup ? "Set up two-factor authentication" : recovery ? "Use a recovery code" : "One more security check"}</h1><p className="muted">{setup ? "Administrator accounts need an authenticator before accessing their workspace." : recovery ? "Enter one of your unused recovery codes." : "Enter the six-digit code from your authenticator app."}</p>{error && <p className="notice danger" role="alert">{error}</p>}{setup && !factor ? <button className="button full" disabled={busy} onClick={begin}>{busy ? "Preparing…" : "Set up authenticator"}</button> : <form onSubmit={submit}><fieldset disabled={busy}>{factor && <><Image className="qr" src={factor.qr} width={224} height={224} alt="Scan this QR code in your authenticator app" unoptimized /><p className="muted">Scan the QR code, or enter this setup key manually:</p><code className="secret-key">{factor.secret}</code></>}{recovery ? <Field key="recovery" label="Recovery code" name="recoveryCode" required autoComplete="off" minLength={13} maxLength={20} /> : <Field key="otp" label="Authenticator code" name="code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" />}<button className="button full">{busy ? "Verifying…" : setup ? "Enable two-factor authentication" : "Verify and continue"}</button></fieldset></form>}{!setup && <button className="text-link" onClick={() => { setRecovery(!recovery); setError(""); }}>{recovery ? "Use authenticator instead" : "Use a recovery code instead"}</button>}<button className="text-link subtle" onClick={onBack} disabled={busy}>Back to sign in</button></>;
}
