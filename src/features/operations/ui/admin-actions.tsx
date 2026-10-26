"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { operationsRequest, operationsUpload, OperationsApiError } from "./api";
import { UiIcon } from "@/components/ui-icon";
import {
  adminControl,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

const campaignField =
  "grid gap-[0.38rem] text-[0.76rem] font-bold text-[#596168]";

function message(error: unknown) {
  return error instanceof OperationsApiError
    ? error.message
    : "Couldn't complete this request.";
}

export function StudentStatusAction({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  return (
    <div className="grid gap-2">
      <button
        className={
          next === "SUSPENDED" ? adminSecondaryButton : adminPrimaryButton
        }
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await operationsRequest(
              `admin/students/${id}/status`,
              { status: next },
              "PATCH",
            );
            router.refresh();
          } catch (value) {
            setError(message(value));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Updating…" : next === "SUSPENDED" ? "Suspend" : "Reactivate"}
      </button>
      {error && (
        <small className="text-[#ad3028]" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

export function ManagedTicketActions({
  ticketId,
  status,
  priority,
}: {
  ticketId: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [internal, setInternal] = useState(false);
  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("reply");
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("internal", String(internal));
    try {
      await operationsUpload(`admin/support/${ticketId}/messages`, data);
      form.reset();
      router.refresh();
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy("");
    }
  }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("status");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await operationsRequest(
        `admin/support/${ticketId}`,
        { status: data.get("status"), priority: data.get("priority") },
        "PATCH",
      );
      router.refresh();
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="border-t border-prep-line bg-[#fcfbf9]">
      <form className="px-5 py-3 max-[700px]:px-[0.85rem]" onSubmit={update}>
        <fieldset
          className="grid grid-cols-[minmax(10rem,14rem)_minmax(9rem,12rem)_auto] items-end justify-start gap-[0.65rem] border-0 p-0 max-[700px]:grid-cols-2 max-[380px]:grid-cols-1"
          disabled={Boolean(busy)}
        >
          <label className="grid gap-1 text-[0.72rem] font-bold text-[#596168]">
            <span>Status</span>
            <select
              className={adminControl}
              name="status"
              defaultValue={status}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="WAITING_FOR_STUDENT">Waiting for student</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="grid gap-1 text-[0.72rem] font-bold text-[#596168]">
            <span>Priority</span>
            <select
              className={adminControl}
              name="priority"
              defaultValue={priority}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>
          <button
            className={`${adminSecondaryButton} max-[700px]:col-span-full max-[380px]:col-span-1`}
            type="submit"
          >
            {busy === "status" ? "Saving…" : "Save state"}
          </button>
        </fieldset>
      </form>
      {status !== "CLOSED" && (
        <form className="border-t border-prep-line bg-white" onSubmit={reply}>
          <div className="flex gap-4 px-5 max-[700px]:px-[0.85rem]">
            <button
              type="button"
              className={`border-b-2 px-[0.1rem] py-3 font-semibold ${!internal ? "border-prep-orange text-prep-ink" : "border-transparent text-prep-muted"}`}
              onClick={() => setInternal(false)}
            >
              Reply
            </button>
            <button
              type="button"
              className={`border-b-2 px-[0.1rem] py-3 font-semibold ${internal ? "border-prep-orange text-prep-ink" : "border-transparent text-prep-muted"}`}
              onClick={() => setInternal(true)}
            >
              Internal note
            </button>
          </div>
          <fieldset
            className="border-0 px-5 pb-4 max-[700px]:px-[0.85rem]"
            disabled={Boolean(busy)}
          >
            <textarea
              className="min-h-24 max-h-56 w-full resize-y rounded-[0.55rem] border border-prep-line bg-white p-3 outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]"
              aria-label={internal ? "Internal note" : "Reply to student"}
              name="body"
              minLength={2}
              maxLength={4000}
              rows={3}
              placeholder={
                internal
                  ? "Add a note visible only to administrators…"
                  : "Type your response…"
              }
              required
            />
            <div className="mt-[0.65rem] flex flex-wrap items-center justify-start gap-4 max-[700px]:grid max-[700px]:grid-cols-[minmax(0,1fr)_auto] max-[380px]:grid-cols-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-prep-control border border-prep-line px-3 py-2 text-[0.72rem] font-bold [&_svg]:size-4">
                <UiIcon name="paperclip" /> Attach file
                <input
                  className="sr-only"
                  name="attachment"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                />
              </label>
              <span className="mr-auto text-[0.68rem] text-prep-muted max-[700px]:col-span-full max-[700px]:row-start-2 max-[700px]:m-0 max-[380px]:row-auto">
                {internal
                  ? "Student will not see this note"
                  : "Reply will notify the student"}
              </span>
              <button
                className={`${adminPrimaryButton} max-[380px]:w-full`}
                type="submit"
              >
                {busy === "reply"
                  ? "Sending…"
                  : internal
                    ? "Add note"
                    : "Send reply"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {error && (
        <p
          className="m-3 rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function NotificationCampaignForm({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [audience, setAudience] = useState("ALL_STUDENTS");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await operationsRequest("admin/notifications", {
        audience,
        productId:
          audience === "PACKAGE_CUSTOMERS" ? data.get("productId") : null,
        title,
        body,
        channel,
      });
      form.reset();
      setTitle("");
      setBody("");
      setAudience("ALL_STUDENTS");
      form.closest("dialog")?.close();
      router.refresh();
    } catch (value) {
      setError(message(value));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="grid gap-[0.9rem] border-0 p-0" disabled={busy}>
        <label className={campaignField}>
          <span>Audience</span>
          <select
            className={adminControl}
            name="audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
          >
            <option value="ALL_STUDENTS">All students</option>
            <option value="PACKAGE_CUSTOMERS">Package customers</option>
            <option value="INACTIVE_STUDENTS">Inactive students</option>
          </select>
        </label>
        {audience === "PACKAGE_CUSTOMERS" && (
          <label className={campaignField}>
            <span>Product package</span>
            <select className={adminControl} name="productId" required>
              <option value="">Choose a package</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={campaignField}>
          <span>Title</span>
          <input
            className={adminControl}
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={180}
            placeholder="Enter notification title"
            required
          />
        </label>
        <label className={campaignField}>
          <span>Message</span>
          <textarea
            className="min-h-[7.5rem] w-full resize-y rounded-[0.45rem] border border-[#cacac5] bg-white p-[0.8rem] font-normal outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]"
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            minLength={3}
            maxLength={500}
            rows={5}
            placeholder="Write a clear message for students…"
            required
          />
          <small className="justify-self-end font-normal text-prep-muted">
            {body.length}/500
          </small>
        </label>
        <div
          className="grid grid-cols-[auto_auto_1fr] items-center gap-3 max-[460px]:grid-cols-1 [&>strong]:col-span-full [&>strong]:text-[0.76rem] [&>strong]:text-[#4b5258]"
          role="radiogroup"
          aria-label="Notification channel"
        >
          <strong>Channel</strong>
          <label className="flex w-max cursor-pointer items-center gap-[0.4rem] rounded-[0.42rem] border border-[#ddd] bg-white px-3 py-2 max-[700px]:w-full max-[700px]:justify-center">
            <input
              className="accent-prep-orange"
              type="radio"
              name="channel"
              value="EMAIL"
              checked={channel === "EMAIL"}
              onChange={() => setChannel("EMAIL")}
            />{" "}
            Email
          </label>
          <label className="flex w-max cursor-pointer items-center gap-[0.4rem] rounded-[0.42rem] border border-[#ddd] bg-white px-3 py-2 max-[700px]:w-full max-[700px]:justify-center">
            <input
              className="accent-prep-orange"
              type="radio"
              name="channel"
              value="IN_APP"
              checked={channel === "IN_APP"}
              onChange={() => setChannel("IN_APP")}
            />{" "}
            In-app
          </label>
        </div>
        <section className="grid gap-[0.4rem]">
          <span className="text-[0.76rem] font-bold text-[#4b5258]">
            Preview
          </span>
          <article className="grid gap-[0.22rem] rounded-[0.48rem] border border-[#e1e4e7] bg-[#f8fafc] p-[0.85rem]">
            <b className="text-[0.68rem] text-[#4b6c9d]">
              {channel === "EMAIL" ? "Email preview" : "In-app preview"}
            </b>
            <strong>{title || "Notification title"}</strong>
            <p className="m-0 text-[0.74rem] leading-[1.5] text-[#687078]">
              {body || "Your message preview will appear here."}
            </p>
          </article>
        </section>
        <div className="mt-[0.15rem] flex justify-end gap-[0.65rem] border-t border-[#e8e6e3] pt-[0.9rem]">
          <button
            className={adminSecondaryButton}
            type="button"
            onClick={(event) => event.currentTarget.closest("dialog")?.close()}
          >
            Cancel
          </button>
          <button className={adminPrimaryButton} type="submit">
            {busy ? "Sending…" : "Send notification"}
          </button>
        </div>
      </fieldset>
      {error && (
        <p
          className="rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}

export function RetryDeliveryButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="grid gap-2">
      <button
        className={adminSecondaryButton}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await operationsRequest(`admin/notifications/${id}/retry`);
            router.refresh();
          } catch (value) {
            setError(message(value));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Sending…" : "Retry email"}
      </button>
      {error && (
        <small className="text-[#ad3028]" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
