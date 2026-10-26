"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { operationsRequest, operationsUpload, OperationsApiError } from "./api";
import { formatIndiaDate, formatIndiaDateTime } from "@/lib/date-time";

function message(error: unknown) {
  return error instanceof OperationsApiError
    ? error.message
    : "Couldn't complete this request.";
}

const secondaryButton =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[.56rem] border border-[#d8d2ca] bg-white px-[1.1rem] py-[.68rem] font-[680] text-[#25272b] transition hover:-translate-y-px hover:border-[#c9c1b8] hover:bg-[#f5f1eb] hover:text-[#17191d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange)] disabled:cursor-not-allowed disabled:opacity-55";
const primaryButton =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[.56rem] border border-[#c73c0b] bg-[#c73c0b] px-[1.1rem] py-[.68rem] font-[680] text-white shadow-[0_.45rem_1.2rem_#ef4d1818] transition hover:-translate-y-px hover:border-[#a92e06] hover:bg-[#a92e06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange)] disabled:cursor-not-allowed disabled:opacity-55";
const supportField = "grid min-w-0 gap-[.45rem]";
const supportControl =
  "h-11 min-h-11 w-full rounded-[.56rem] border border-[#d5cec6] bg-white px-[.8rem] py-[.7rem] text-[var(--ink)] outline-none focus:border-[#f07950] focus:ring-3 focus:ring-[#ef4d1810]";
const dangerNotice =
  "rounded-[.6rem] border border-[#dfb6b2] bg-[#fbf3f2] px-4 py-[.85rem] leading-6 text-[#8c332f]";

export function SessionList({
  sessions,
}: {
  sessions: {
    id: string;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
    current: boolean;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <section
          className="grid grid-cols-[auto_1fr_auto] items-center gap-[1.2rem] rounded-[.85rem] border border-[var(--line)] bg-white p-[1.6rem] shadow-[0_.6rem_2rem_#3a2b2108] max-[800px]:grid-cols-[auto_1fr] max-[800px]:[&>:last-child]:col-start-2"
          key={session.id}
        >
          <span
            className="grid size-11 place-items-center rounded-full bg-[var(--orange-soft)] font-extrabold text-[var(--orange)]"
            aria-hidden="true"
          >
            □
          </span>
          <div>
            <h2 className="my-[.55rem] text-base">
              {session.current
                ? "Current session"
                : deviceName(session.userAgent)}
            </h2>
            <p className="my-1 text-sm leading-[1.6] text-[var(--muted)]">
              Signed in {formatIndiaDateTime(session.createdAt)} · expires{" "}
              {formatIndiaDate(session.expiresAt)}
            </p>
          </div>
          {session.current ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#bfe2cc] bg-[#e7f4ec] px-2.5 py-[.3rem] text-xs leading-tight font-extrabold text-[#276448]">
              This device
            </span>
          ) : (
            <button
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[.56rem] border border-[#d8d2ca] bg-white px-[1.1rem] py-[.68rem] font-[680] text-[#25272b] transition hover:-translate-y-px hover:border-[#c9c1b8] hover:bg-[#f5f1eb] hover:text-[#17191d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange)] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={busy === session.id}
              onClick={async () => {
                setBusy(session.id);
                setError("");
                try {
                  await operationsRequest(
                    `sessions/${session.id}`,
                    undefined,
                    "DELETE",
                  );
                  router.refresh();
                } catch (value) {
                  setError(message(value));
                } finally {
                  setBusy("");
                }
              }}
            >
              {busy === session.id ? "Revoking…" : "Revoke"}
            </button>
          )}
        </section>
      ))}
      {error && (
        <p
          className="rounded-[.6rem] border border-[#dfb6b2] bg-[#fbf3f2] px-4 py-[.85rem] leading-6 text-[#8c332f]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function NotificationActions({ unreadIds }: { unreadIds: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function act(path: string) {
    setBusy(path);
    setError("");
    try {
      await operationsRequest(path);
      router.refresh();
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy("");
    }
  }
  if (!unreadIds.length) return null;
  return (
    <div className="grid justify-items-end gap-[.65rem] max-[700px]:justify-items-start">
      <button
        className={secondaryButton}
        disabled={Boolean(busy)}
        onClick={() => act("notifications/read-all")}
      >
        {busy ? "Updating…" : "Mark all as read"}
      </button>
      {error && (
        <p className={dangerNotice} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function NotificationReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="cursor-pointer border-0 bg-transparent p-0 text-[.78rem] font-bold text-prep-orange max-[700px]:col-start-2 max-[700px]:justify-self-start"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await operationsRequest(`notifications/${id}/read`);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Updating…" : "Mark read"}
    </button>
  );
}

export function NewSupportTicketForm({
  orders,
}: {
  orders: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = await operationsRequest<{ id: string }>("support", {
        subject: data.get("subject"),
        category: data.get("category"),
        orderId: data.get("orderId") || null,
        message: data.get("message"),
      });
      router.push(`/dashboard/support/${result.id}`);
      router.refresh();
    } catch (value) {
      setError(message(value));
      setBusy(false);
    }
  }
  return (
    <form className="mt-[1.3rem]" onSubmit={submit}>
      <fieldset
        className="m-0 grid grid-cols-2 gap-[.85rem] border-0 p-0 max-[700px]:grid-cols-1"
        disabled={busy}
      >
        <label className={supportField}>
          <span className="text-sm font-[750]">Category</span>
          <select
            className={supportControl}
            name="category"
            defaultValue="ACCOUNT"
          >
            <option value="ACCOUNT">Account</option>
            <option value="PAYMENT">Payment or order</option>
            <option value="TEST">Mock test</option>
            <option value="MATERIAL">Study material</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className={supportField}>
          <span className="text-sm font-[750]">Related order (optional)</span>
          <select className={supportControl} name="orderId" defaultValue="">
            <option value="">No related order</option>
            {orders.map((order) => (
              <option value={order.id} key={order.id}>
                {order.label}
              </option>
            ))}
          </select>
        </label>
        <label
          className={`${supportField} col-span-full max-[700px]:col-span-1`}
        >
          <span className="text-sm font-[750]">Subject</span>
          <input
            className={supportControl}
            name="subject"
            minLength={5}
            maxLength={200}
            required
          />
        </label>
        <label
          className={`${supportField} col-span-full max-[700px]:col-span-1`}
        >
          <span className="text-sm font-[750]">How can we help?</span>
          <textarea
            className={`${supportControl} h-auto min-h-32 resize-y leading-6`}
            name="message"
            minLength={5}
            maxLength={4000}
            rows={6}
            required
          />
        </label>
        <button
          className={`${primaryButton} col-span-full min-w-48 justify-self-end max-[700px]:col-span-1 max-[700px]:w-full max-[700px]:min-w-0`}
          type="submit"
        >
          {busy ? "Creating…" : "Create support ticket"}
        </button>
      </fieldset>
      {error && (
        <p className={`${dangerNotice} mt-[.85rem]`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function SupportReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await operationsUpload(`support/${ticketId}/messages`, data);
      form.reset();
      router.refresh();
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="m-0 grid gap-[.55rem] border-0 p-0" disabled={busy}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-[.55rem] max-[700px]:grid-cols-1">
          <label className="grid min-w-0 gap-[.45rem]">
            <span className="sr-only">Write a reply</span>
            <textarea
              className="min-h-[2.8rem] max-h-36 w-full resize-y rounded-[.35rem] border border-[#dedfe1] bg-white px-[.8rem] py-[.7rem] text-[.78rem] outline-none focus:border-[#087f8c] focus:ring-3 focus:ring-[#087f8c17]"
              name="body"
              minLength={2}
              maxLength={4000}
              rows={2}
              placeholder="Write a reply…"
              required
            />
          </label>
          <button
            className="min-h-[2.8rem] cursor-pointer rounded-[.4rem] border border-prep-orange bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-55"
            type="submit"
          >
            {busy ? "Sending…" : "Send Reply"}
          </button>
        </div>
        <label className="relative flex cursor-pointer items-center gap-[.45rem] px-[.1rem] text-[.72rem] font-semibold text-[#b5421c] max-[700px]:grid max-[700px]:w-full max-[700px]:grid-cols-[auto_auto_minmax(0,1fr)]">
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="m21 11.5-8.7 8.7a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.3 9.3a2 2 0 0 1-2.8-2.8l8.6-8.6" />
          </svg>
          <span>Attach files</span>
          <small className="text-[.6rem] text-prep-muted max-[700px]:justify-self-end max-[700px]:text-right">
            Max 5 MB per file (PDF, PNG, JPG)
          </small>
          <input
            className="absolute size-px overflow-hidden opacity-0"
            name="attachment"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
          />
        </label>
      </fieldset>
      {error && (
        <p
          className="m-0 rounded-[.5rem] border border-[#f4aaa4] bg-[#fff1f0] px-4 py-3 text-[.78rem] leading-normal text-[#a62a24]"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}

function deviceName(userAgent: string | null) {
  if (!userAgent) return "Signed-in device";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad/.test(userAgent)
        ? "iOS"
        : /Mac OS/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "device";
  return `${browser} on ${system}`;
}
