"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      result?.error?.message ?? "Couldn't complete this request.",
    );
  return result.data as T;
}

export function StudentReviewForm({
  productId,
  initial,
}: {
  productId: string;
  initial?: { rating: number; comment: string; feedback: string | null };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      await request("/api/reviews", {
        productId,
        rating: data.get("rating"),
        comment: data.get("comment"),
        feedback: data.get("feedback"),
      });
      setMessage("Thanks—your review and feedback were submitted.");
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Couldn't submit your review.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="mt-4" onSubmit={submit}>
      <fieldset
        className="m-0 grid grid-cols-[minmax(10rem,.35fr)_1fr] gap-[.9rem] border-0 p-0 max-[700px]:grid-cols-1 [&>.review-wide]:col-span-full"
        disabled={busy}
      >
        <label className="grid gap-[.45rem] text-[.9rem] font-bold">
          <span>Rating</span>
          <select
            className="min-h-12 w-full rounded-[.55rem] border border-[#bdc9d5] bg-white px-[.8rem] py-[.7rem] text-[#17191d] outline-none focus:border-[#e94b17] focus:ring-2 focus:ring-[#ffdfd2]"
            name="rating"
            defaultValue={initial?.rating ?? 5}
          >
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Very good</option>
            <option value="3">3 — Good</option>
            <option value="2">2 — Fair</option>
            <option value="1">1 — Poor</option>
          </select>
        </label>
        <label className="review-wide grid gap-[.45rem] text-[.9rem] font-bold">
          <span>Package review</span>
          <textarea
            className="w-full resize-y rounded-[.55rem] border border-[#bdc9d5] bg-white px-[.8rem] py-3 font-normal leading-6 text-[#17191d] outline-none focus:border-[#e94b17] focus:ring-2 focus:ring-[#ffdfd2]"
            name="comment"
            defaultValue={initial?.comment}
            minLength={10}
            maxLength={1000}
            rows={4}
            required
            placeholder="What helped you, and what should another learner know?"
          />
          <small className="text-[.79rem] leading-[1.4] font-normal text-[#6d7077]">
            Your review may be shown on the package details page.
          </small>
        </label>
        <label className="review-wide grid gap-[.45rem] text-[.9rem] font-bold">
          <span>
            Private feedback <small>(optional)</small>
          </span>
          <textarea
            className="w-full resize-y rounded-[.55rem] border border-[#bdc9d5] bg-white px-[.8rem] py-3 font-normal leading-6 text-[#17191d] outline-none focus:border-[#e94b17] focus:ring-2 focus:ring-[#ffdfd2]"
            name="feedback"
            defaultValue={initial?.feedback ?? ""}
            maxLength={2000}
            rows={3}
            placeholder="Suggestions for Prepstore. This is never shown publicly."
          />
        </label>
        <button
          className="review-wide inline-flex min-h-11 items-center justify-center justify-self-start rounded-prep-control bg-prep-orange px-5 font-bold text-white hover:bg-prep-orange-dark max-[700px]:w-full"
          type="submit"
        >
          {busy ? "Submitting…" : initial ? "Update review" : "Submit review"}
        </button>
      </fieldset>
      {error ? (
        <p
          className="mt-3 rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-3 rounded-prep-control border border-[#bfe2cc] bg-[#e7f4ec] p-3 text-sm text-[#276448]"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function ReviewModerationActions({
  reviewId,
  currentStatus,
}: {
  reviewId: string;
  currentStatus: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function moderate(status: "APPROVED" | "REJECTED") {
    setBusy(status);
    setError("");
    try {
      await request(`/api/admin/reviews/${reviewId}`, { status });
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Couldn't update this review.",
      );
    } finally {
      setBusy("");
    }
  }
  const guidance =
    currentStatus === "APPROVED"
      ? "Visible on the package page"
      : currentStatus === "REJECTED"
        ? "Hidden from the package page"
        : "Choose whether this review should be public";
  return (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-[600px]:grid-cols-1">
      <span className="leading-[1.65] text-prep-muted">{guidance}</span>
      <div className="flex gap-2 max-[600px]:w-full max-[600px]:[&>button]:flex-1">
        {currentStatus !== "APPROVED" ? (
          <button
            type="button"
            className="inline-flex min-h-[2.45rem] cursor-pointer items-center justify-center rounded-prep-control border border-prep-orange bg-prep-orange px-[0.9rem] py-[0.55rem] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
            disabled={Boolean(busy)}
            onClick={() => moderate("APPROVED")}
          >
            {busy === "APPROVED"
              ? "Publishing…"
              : currentStatus === "REJECTED"
                ? "Publish review"
                : "Publish"}
          </button>
        ) : null}
        {currentStatus !== "REJECTED" ? (
          <button
            type="button"
            className="inline-flex min-h-[2.45rem] cursor-pointer items-center justify-center rounded-prep-control border border-[#d9dadd] bg-white px-[0.9rem] py-[0.55rem] text-sm font-bold text-[#343a3f] disabled:cursor-not-allowed disabled:opacity-55"
            disabled={Boolean(busy)}
            onClick={() => moderate("REJECTED")}
          >
            {busy === "REJECTED"
              ? "Hiding…"
              : currentStatus === "APPROVED"
                ? "Hide review"
                : "Hide"}
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          className="col-span-full rounded-[0.6rem] border border-[#e0a7a2] bg-[#fff0ef] px-4 py-[0.85rem] leading-[1.5] text-prep-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
