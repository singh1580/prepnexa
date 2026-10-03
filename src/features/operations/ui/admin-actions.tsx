"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { operationsRequest, operationsUpload, OperationsApiError } from "./api";

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
    <div className="inline-action">
      <button
        className={next === "SUSPENDED" ? "button secondary" : "button"}
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
      {error && <small role="alert">{error}</small>}
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
    <div className="ticket-action-stack">
      <form className="ticket-state-form" onSubmit={update}>
        <fieldset disabled={Boolean(busy)}>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={status}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="WAITING_FOR_STUDENT">Waiting for student</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select name="priority" defaultValue={priority}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </label>
          <button className="button secondary small" type="submit">
            {busy === "status" ? "Saving…" : "Save state"}
          </button>
        </fieldset>
      </form>
      {status !== "CLOSED" && (
        <form className="support-composer" onSubmit={reply}>
          <div className="composer-tabs">
            <button
              type="button"
              className={!internal ? "active" : ""}
              onClick={() => setInternal(false)}
            >
              Reply
            </button>
            <button
              type="button"
              className={internal ? "active" : ""}
              onClick={() => setInternal(true)}
            >
              Internal note
            </button>
          </div>
          <fieldset disabled={Boolean(busy)}>
            <textarea
              aria-label={internal ? "Internal note" : "Reply to student"}
              name="body"
              minLength={2}
              maxLength={4000}
              rows={5}
              placeholder={
                internal
                  ? "Add a note visible only to administrators…"
                  : "Type your response…"
              }
              required
            />
            <div className="composer-footer">
              <label className="attachment-button">
                ⌕ Attach
                <input
                  name="attachment"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                />
              </label>
              <span>
                {internal
                  ? "Student will not see this note"
                  : "Reply will notify the student"}
              </span>
              <button className="button small" type="submit">
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
        <p className="notice danger" role="alert">
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
    <form className="notification-campaign-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label className="field">
          <span>Audience</span>
          <select
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
          <label className="field">
            <span>Product package</span>
            <select name="productId" required>
              <option value="">Choose a package</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Title</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={180}
            placeholder="Enter notification title"
            required
          />
        </label>
        <label className="field">
          <span>Message</span>
          <textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            minLength={3}
            maxLength={500}
            rows={5}
            placeholder="Write a clear message for students…"
            required
          />
          <small>{body.length}/500</small>
        </label>
        <div className="notification-channel" role="radiogroup" aria-label="Notification channel">
          <strong>Channel</strong>
          <label>
            <input
              type="radio"
              name="channel"
              value="EMAIL"
              checked={channel === "EMAIL"}
              onChange={() => setChannel("EMAIL")}
            />{" "}
            Email
          </label>
          <label>
            <input
              type="radio"
              name="channel"
              value="IN_APP"
              checked={channel === "IN_APP"}
              onChange={() => setChannel("IN_APP")}
            />{" "}
            In-app
          </label>
        </div>
        <section className="notification-preview">
          <span>Preview</span>
          <article>
            <b>{channel === "EMAIL" ? "Email preview" : "In-app preview"}</b>
            <strong>{title || "Notification title"}</strong>
            <p>{body || "Your message preview will appear here."}</p>
          </article>
        </section>
        <div className="dialog-form-footer">
          <button className="button secondary" type="button" onClick={(event) => event.currentTarget.closest("dialog")?.close()}>
            Cancel
          </button>
          <button className="button" type="submit">
            {busy ? "Sending…" : "Send notification"}
          </button>
        </div>
      </fieldset>
      {error && (
        <p className="notice danger" role="alert">
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
    <div className="inline-action">
      <button
        className="button secondary"
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
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
