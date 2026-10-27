"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authRequest, ClientApiError } from "@/features/auth/ui/api";
import { Field } from "@/features/auth/ui/field";

const primaryButton =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[.4rem] border border-prep-orange bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButton =
  "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[.4rem] border border-[#c8c9ca] bg-white px-4 py-2 text-[.75rem] font-bold text-[#4d5459] hover:bg-[#f5f5f4] disabled:cursor-not-allowed disabled:opacity-55";
const formFieldset = "m-0 grid gap-4 border-0 p-0";
const successNotice =
  "mt-3 rounded-[.5rem] border border-[#bfe2cc] bg-[#e7f4ec] px-4 py-3 text-[.78rem] text-[#276448]";
const errorNotice =
  "mt-3 rounded-[.5rem] border border-[#f4aaa4] bg-[#fff1f0] px-4 py-3 text-[.78rem] text-[#a62a24]";

export function LogoutButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirming && !dialog.open) dialog.showModal();
    if (!confirming && dialog.open) dialog.close();
  }, [busy, confirming]);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await authRequest("logout", {});
      window.location.replace("/login");
    } catch {
      setError("Couldn't sign out. Please try again.");
      setBusy(false);
      setConfirming(false);
    }
  }
  return (
    <>
      <button
        className={secondaryButton}
        type="button"
        disabled={busy}
        onClick={() => setConfirming(true)}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto max-h-none max-w-none border-0 bg-transparent p-0 backdrop:bg-[rgba(26,23,21,.46)] backdrop:backdrop-blur-[2px]"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          if (busy) event.preventDefault();
          else setConfirming(false);
        }}
        onClose={() => setConfirming(false)}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy)
            setConfirming(false);
        }}
      >
        <section className="w-[min(25rem,calc(100vw-2rem))] rounded-[.8rem] border border-[#e6e2de] bg-white p-5 text-[#202327] shadow-[0_1.5rem_4rem_rgba(28,23,20,.22)]">
          <h2
            className="mt-0 mb-[.45rem] text-[1.15rem] leading-tight"
            id={titleId}
          >
            Sign out of Prepstore?
          </h2>
          <p
            className="m-0 text-[.85rem] leading-[1.55] text-[#687077]"
            id={descriptionId}
          >
            You will need to sign in again to access your account and learning
            dashboard.
          </p>
          <div className="mt-[1.15rem] flex justify-end gap-[.65rem] max-[420px]:grid max-[420px]:grid-cols-2">
            <button
              className={`${secondaryButton} min-w-[6.5rem] max-[420px]:w-full max-[420px]:min-w-0`}
              type="button"
              disabled={busy}
              autoFocus
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              className={`${primaryButton} min-w-[6.5rem] max-[420px]:w-full max-[420px]:min-w-0`}
              type="button"
              disabled={busy}
              onClick={() => void logout()}
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </section>
      </dialog>
      {error && (
        <p className={errorNotice} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function ProfileForm({
  name,
  email,
  phone,
  verified,
}: {
  name: string;
  email: string;
  phone: string | null;
  verified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await authRequest(
        "profile",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setMessage("Your profile has been updated.");
      router.refresh();
    } catch (e) {
      if (e instanceof ClientApiError && e.code === "UNAUTHENTICATED")
        router.push("/login?reason=session");
      else setError(e instanceof Error ? e.message : "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset className={formFieldset} disabled={busy}>
        <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          <Field
            label="Full name"
            name="name"
            defaultValue={name}
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
          />
          <Field
            label="Phone number"
            name="phone"
            defaultValue={phone ?? ""}
            autoComplete="tel"
            minLength={7}
            maxLength={20}
          />
        </div>
        <Field
          label="Email address"
          name="email"
          value={email}
          readOnly
          hint={
            verified
              ? "Verified email. Email changes aren't available here."
              : "Email verification is pending."
          }
        />
        <button
          className={`${primaryButton} justify-self-end max-[700px]:w-full`}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </fieldset>
      {message && (
        <p className={successNotice} role="status">
          {message}
        </p>
      )}
      {error && (
        <p className={errorNotice} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

type StudentProfile = {
  name: string;
  email: string;
  phone: string | null;
  classLevel: string | null;
  board: string | null;
  targetExam: string | null;
  dateOfBirth: string | null;
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

export function StudentProfileForm({
  profile,
  verified,
}: {
  profile: StudentProfile;
  verified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await authRequest("profile", {
        name: data.get("name"),
        phone: data.get("phone"),
        classLevel: data.get("classLevel"),
        board: data.get("board"),
        targetExam: data.get("targetExam"),
        dateOfBirth: data.get("dateOfBirth"),
      });
      setMessage("Your profile has been updated.");
      router.refresh();
    } catch (value) {
      if (value instanceof ClientApiError && value.code === "UNAUTHENTICATED")
        router.push("/login?reason=session");
      else
        setError(
          value instanceof Error ? value.message : "Couldn't save changes.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset className={formFieldset} disabled={busy}>
        <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
          <Field
            label="Full name"
            name="name"
            defaultValue={profile.name}
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
          />
          <Field
            label="Phone number"
            name="phone"
            defaultValue={profile.phone ?? ""}
            autoComplete="tel"
            minLength={7}
            maxLength={20}
          />
          <Field
            label="Class / qualification"
            name="classLevel"
            defaultValue={profile.classLevel ?? ""}
            maxLength={120}
            placeholder="For example: B.Tech, Class 12"
          />
          <Field
            label="Board / university"
            name="board"
            defaultValue={profile.board ?? ""}
            maxLength={120}
          />
          <Field
            label="Target exam"
            name="targetExam"
            defaultValue={profile.targetExam ?? ""}
            maxLength={160}
            placeholder="For example: TCS NQT"
          />
          <Field
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            defaultValue={profile.dateOfBirth ?? ""}
          />
        </div>
        <Field
          label="Email address"
          name="email"
          value={profile.email}
          readOnly
          hint={
            verified
              ? "Verified email. Email changes aren't available here."
              : "Email verification is pending."
          }
        />
        <button
          className={`${primaryButton} justify-self-end max-[700px]:w-full`}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </fieldset>
      {message ? (
        <p className={successNotice} role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={errorNotice} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function NotificationPreferencesForm({
  profile,
}: {
  profile: StudentProfile;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await authRequest("profile", {
        name: profile.name,
        phone: profile.phone,
        classLevel: profile.classLevel,
        board: profile.board,
        targetExam: profile.targetExam,
        dateOfBirth: profile.dateOfBirth,
        emailNotifications: data.has("emailNotifications"),
        inAppNotifications: data.has("inAppNotifications"),
      });
      setMessage("Notification preferences saved.");
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Couldn't save preferences.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="m-0 grid border-0 p-0" disabled={busy}>
        <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[#eceae7] py-4 first:border-t-0">
          <span className="grid gap-1">
            <strong className="text-[.78rem]">Email notifications</strong>
            <small className="text-[.7rem] leading-relaxed text-prep-muted">
              Order confirmations, support replies and important account
              updates.
            </small>
          </span>
          <input
            className="peer sr-only"
            type="checkbox"
            name="emailNotifications"
            defaultChecked={profile.emailNotifications}
          />
          <i
            className="relative h-6 w-11 rounded-full bg-[#c8cdd1] transition-colors after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[#e84916] peer-checked:after:translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#087f8c40]"
            aria-hidden="true"
          />
        </label>
        <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[#eceae7] py-4">
          <span className="grid gap-1">
            <strong className="text-[.78rem]">In-app notifications</strong>
            <small className="text-[.7rem] leading-relaxed text-prep-muted">
              Learning updates and announcements inside your dashboard.
            </small>
          </span>
          <input
            className="peer sr-only"
            type="checkbox"
            name="inAppNotifications"
            defaultChecked={profile.inAppNotifications}
          />
          <i
            className="relative h-6 w-11 rounded-full bg-[#c8cdd1] transition-colors after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[#e84916] peer-checked:after:translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#087f8c40]"
            aria-hidden="true"
          />
        </label>
        <button
          className={`${secondaryButton} mt-3 justify-self-end max-[700px]:w-full`}
          type="submit"
        >
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </fieldset>
      {message ? (
        <p className={successNotice} role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={errorNotice} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function ChangePasswordForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("newPassword") !== data.get("confirmPassword")) {
      setError("New passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      await authRequest("change-password", {
        currentPassword: data.get("currentPassword"),
        newPassword: data.get("newPassword"),
      });
      form.reset();
      setMessage("Password updated. Other signed-in sessions were revoked.");
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Could not update password.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset
        className="m-0 grid grid-cols-2 gap-[.7rem] border-0 p-0 max-[700px]:grid-cols-1 [&>:first-child]:col-span-full [&>:last-of-type]:col-span-full"
        disabled={busy}
      >
        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          minLength={10}
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
        <button
          className={`${primaryButton} col-span-full justify-self-end max-[700px]:w-full`}
          type="submit"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </fieldset>
      {message ? (
        <p className={successNotice} role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className={errorNotice} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
