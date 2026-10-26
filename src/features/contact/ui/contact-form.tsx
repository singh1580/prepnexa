"use client";

import { useState, type FormEvent } from "react";

type ApiResult = {
  data?: { reference: string | null };
  error?: { message?: string };
};

const field = "grid min-w-0 gap-[.42rem]";
const label = "text-[.73rem] font-[750]";
const control =
  "w-full min-w-0 rounded-[.42rem] border border-[#cfd2d4] bg-white px-[.8rem] py-3 text-[.8rem] text-[#202327] outline-none focus:border-[#ed4a15] focus:ring-3 focus:ring-[#ed4a1514]";

export function ContactForm({
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "We could not submit your enquiry. Please try again.",
        );
      setSuccess(
        result.data?.reference
          ? `Your enquiry has been received. Reference: ${result.data.reference}`
          : "Your enquiry has been received.",
      );
      form.reset();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "We could not submit your enquiry. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={busy}>
      <fieldset className="m-0 grid gap-4 border-0 p-0" disabled={busy}>
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <label className={field}>
            <span className={label}>Full name</span>
            <input
              className={`${control} h-[2.8rem]`}
              name="name"
              autoComplete="name"
              defaultValue={defaultName}
              minLength={2}
              maxLength={120}
              required
            />
          </label>
          <label className={field}>
            <span className={label}>Email address</span>
            <input
              className={`${control} h-[2.8rem]`}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={defaultEmail}
              maxLength={320}
              required
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <label className={field}>
            <span className={label}>
              Phone{" "}
              <small className="ml-1 text-[.62rem] font-medium text-prep-muted">
                Optional
              </small>
            </span>
            <input
              className={`${control} h-[2.8rem]`}
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={defaultPhone ?? ""}
              maxLength={20}
            />
          </label>
          <label className={field}>
            <span className={label}>Enquiry type</span>
            <select
              className={`${control} h-[2.8rem]`}
              name="category"
              defaultValue="GENERAL"
              required
            >
              <option value="GENERAL">General enquiry</option>
              <option value="BUSINESS">Business or institution</option>
              <option value="CONTENT_PERMISSION">Content permission</option>
              <option value="PRIVACY">Privacy request</option>
              <option value="GRIEVANCE">Formal grievance</option>
            </select>
          </label>
        </div>
        <label className={field}>
          <span className={label}>Subject</span>
          <input
            className={`${control} h-[2.8rem]`}
            name="subject"
            minLength={5}
            maxLength={180}
            required
          />
        </label>
        <label className={field}>
          <span className={label}>How can we help?</span>
          <textarea
            className={`${control} resize-y leading-normal`}
            name="message"
            rows={6}
            minLength={20}
            maxLength={5000}
            required
          />
        </label>
        <label
          className="absolute left-[-10000px] size-px overflow-hidden"
          aria-hidden="true"
        >
          <span>Website</span>
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <div className="flex items-center justify-between gap-4 pt-1 max-[560px]:flex-col max-[560px]:items-stretch">
          <p className="m-0 max-w-[25rem] text-[.66rem] leading-[1.45] text-prep-muted">
            Do not include passwords, OTPs, UPI PINs, CVV or full card details.
          </p>
          <button
            className="min-w-36 cursor-pointer rounded-[.4rem] border-0 bg-prep-orange px-4 py-[.78rem] text-[.76rem] font-extrabold text-white hover:bg-prep-orange-dark disabled:cursor-wait disabled:opacity-65 max-[560px]:w-full"
            type="submit"
          >
            {busy ? "Sending…" : "Send enquiry"}
          </button>
        </div>
      </fieldset>
      {error ? (
        <p
          className="mt-4 mb-0 rounded-[.4rem] bg-[#fff0ee] p-3 text-[.75rem] leading-normal text-[#a52e21]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-4 mb-0 rounded-[.4rem] bg-[#ebf8ef] p-3 text-[.75rem] leading-normal text-[#176c38]"
          role="status"
        >
          {success}
        </p>
      ) : null}
    </form>
  );
}
