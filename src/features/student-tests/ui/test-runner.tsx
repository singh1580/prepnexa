"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";
import { answerInputFromState } from "@/features/student-tests/answer-payload";
import { UiIcon } from "@/components/ui-icon";

type Answer = {
  selectedOptionIds: string[];
  textAnswer: string | null;
  numericAnswer: string | null;
  markedForReview: boolean;
  timeSpentSeconds: number;
  version: number;
  savedAt: string | null;
};
type Question = {
  id: string;
  questionId: string;
  sectionId: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT";
  position: number;
  stem: string;
  imageUrl: string | null;
  marks: string;
  negativeMarks: string;
  options: { id: string; body: string; position: number }[];
  answer: Answer;
};
type Attempt = {
  id: string;
  status: string;
  title: string;
  examName: string;
  serverDeadlineAt: string | null;
  serverTime: string;
  remainingSeconds: number;
  sections: { id: string; title: string }[];
  questions: Question[];
};

function isAnswered(question: Question, answer: Answer) {
  if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE")
    return answer.selectedOptionIds.length > 0;
  if (question.type === "NUMERIC") return Boolean(answer.numericAnswer);
  return Boolean(answer.textAnswer?.trim());
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}

function externalImageLoader({ src }: { src: string }) {
  return src;
}

function paletteStateClass(state: string, current: boolean) {
  const colour =
    state === "answered"
      ? "border-[#b6e5c6] bg-[#ccefd8] text-[#2e6654]"
      : state === "not-answered"
        ? "border-[#ffc6c6] bg-[#ffd5d5] text-[#853b36]"
        : state === "review"
          ? "border-[#c8b8f7] bg-[#d8ccfb] text-[#60476b]"
          : "border-[#cfd1d3] bg-white text-[#292e32]";
  return `${colour} ${current ? "outline-2 outline-offset-1 outline-[#ef4b17]" : ""}`;
}
export function TestRunner({
  attempt,
  courseSlug,
}: {
  attempt: Attempt;
  courseSlug?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(() =>
    Object.fromEntries(
      attempt.questions.map((question) => [question.id, question.answer]),
    ),
  );
  const answersRef = useRef(answers);
  const versions = useRef(
    new Map(
      attempt.questions.map((question) => [
        question.id,
        question.answer.version,
      ]),
    ),
  );
  const queues = useRef(new Map<string, Promise<void>>());
  const dirtyAnswers = useRef(new Set<string>());
  const submitRef = useRef<(automatic?: boolean) => Promise<void>>(
    async () => {},
  );
  const saveRef = useRef<(snapshotId: string) => void>(() => {});
  const timingTicks = useRef(0);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState("");
  const currentRef = useRef(0);
  const [visited, setVisited] = useState<Set<string>>(
    () =>
      new Set(
        attempt.questions
          .filter((item) => item.answer.savedAt)
          .map((item) => item.id)
          .concat(attempt.questions[0] ? [attempt.questions[0].id] : []),
      ),
  );
  const [submitted, setSubmitted] = useState(attempt.status !== "IN_PROGRESS");
  const [submitting, setSubmitting] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(attempt.remainingSeconds);
  const question = attempt.questions[current];
  const section = attempt.sections.find(
    (item) => item.id === question?.sectionId,
  );
  const answeredCount = useMemo(
    () =>
      attempt.questions.filter((item) => isAnswered(item, answers[item.id]))
        .length,
    [answers, attempt.questions],
  );
  const sectionQuestions = useMemo(
    () =>
      attempt.questions
        .map((item, index) => ({ item, index }))
        .filter((entry) => entry.item.sectionId === section?.id),
    [attempt.questions, section?.id],
  );
  const sectionPosition = sectionQuestions.findIndex(
    (entry) => entry.index === current,
  );

  function goToQuestion(index: number) {
    if (index === current || index < 0 || index >= attempt.questions.length)
      return;
    const active = attempt.questions[current];
    if (active && dirtyAnswers.current.has(active.id)) queueSave(active.id);
    const nextId = attempt.questions[index].id;
    setVisited((value) => {
      const next = new Set(value);
      next.add(nextId);
      return next;
    });
    currentRef.current = index;
    setCurrent(index);
  }

  function updateAnswer(
    snapshotId: string,
    patch: Partial<Answer>,
    persist = true,
  ) {
    const next = { ...answersRef.current[snapshotId], ...patch };
    answersRef.current = { ...answersRef.current, [snapshotId]: next };
    setAnswers(answersRef.current);
    dirtyAnswers.current.add(snapshotId);
    if (persist) queueSave(snapshotId);
  }

  function queueSave(snapshotId: string) {
    if (queues.current.has(snapshotId)) return;
    const answerAtStart = answersRef.current[snapshotId];
    const contentAtStart = JSON.stringify({
      selectedOptionIds: answerAtStart.selectedOptionIds,
      textAnswer: answerAtStart.textAnswer,
      numericAnswer: answerAtStart.numericAnswer,
      markedForReview: answerAtStart.markedForReview,
    });
    let saved = false;
    const task = (async () => {
        setSaving((value) => value + 1);
        setError("");
        try {
          const answer = answersRef.current[snapshotId];
          const sent = JSON.stringify({
            selectedOptionIds: answer.selectedOptionIds,
            textAnswer: answer.textAnswer,
            numericAnswer: answer.numericAnswer,
            markedForReview: answer.markedForReview,
            timeSpentSeconds: answer.timeSpentSeconds,
          });
          const response = await fetch(
            `/api/attempts/${attempt.id}/answers/${snapshotId}`,
            {
              method: "PATCH",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                answerInputFromState(
                  answer,
                  versions.current.get(snapshotId) ?? 0,
                ),
              ),
            },
          );
          const payload = (await response.json()) as
            ApiSuccess<{ version: number; savedAt: string }> | ApiFailure;
          if (!response.ok || "error" in payload)
            throw new Error(
              "error" in payload
                ? payload.error.message
                : "Couldn't save this answer.",
            );
          versions.current.set(snapshotId, payload.data.version);
          const currentAnswer = answersRef.current[snapshotId];
          answersRef.current = {
            ...answersRef.current,
            [snapshotId]: {
              ...currentAnswer,
              version: payload.data.version,
              savedAt: payload.data.savedAt,
            },
          };
          setAnswers(answersRef.current);
          const current = answersRef.current[snapshotId];
          if (
            JSON.stringify({
              selectedOptionIds: current.selectedOptionIds,
              textAnswer: current.textAnswer,
              numericAnswer: current.numericAnswer,
              markedForReview: current.markedForReview,
              timeSpentSeconds: current.timeSpentSeconds,
            }) === sent
          )
            dirtyAnswers.current.delete(snapshotId);
          saved = true;
        } catch (reason) {
          const message =
            reason instanceof Error
              ? reason.message
              : "Couldn't save this answer.";
          setError(message);
          throw reason;
        } finally {
          setSaving((value) => Math.max(0, value - 1));
        }
      })();
    queues.current.set(snapshotId, task);
    void task
      .finally(() => {
        if (queues.current.get(snapshotId) === task)
          queues.current.delete(snapshotId);
        if (!saved || !dirtyAnswers.current.has(snapshotId)) return;
        const current = answersRef.current[snapshotId];
        const currentContent = JSON.stringify({
          selectedOptionIds: current.selectedOptionIds,
          textAnswer: current.textAnswer,
          numericAnswer: current.numericAnswer,
          markedForReview: current.markedForReview,
        });
        // A user change made while the request was in flight must be saved next.
        // Timer-only changes wait for the next interval instead of building an
        // unbounded queue on slow connections.
        if (currentContent !== contentAtStart)
          window.queueMicrotask(() => queueSave(snapshotId));
      })
      .catch(() => undefined);
  }

  async function performSubmit(automatic = false) {
    if (submitting || submitted) return;
    if (
      !automatic &&
      !window.confirm(
        `Submit this test? ${attempt.questions.length - answeredCount} question(s) are unanswered.`,
      )
    )
      return;
    setSubmitting(true);
    setError("");
    let saveFailed = false;
    while (dirtyAnswers.current.size || queues.current.size) {
      for (const snapshotId of dirtyAnswers.current) queueSave(snapshotId);
      const activeSaves = [...queues.current.values()];
      if (!activeSaves.length) break;
      const settled = await Promise.allSettled(activeSaves);
      if (settled.some((item) => item.status === "rejected")) {
        saveFailed = true;
        break;
      }
    }
    if (!automatic && saveFailed) {
      setError(
        "One or more answers were not saved. Check your connection and try again.",
      );
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as
        ApiSuccess<{ status: string; resultId: string }> | ApiFailure;
      if (!response.ok || "error" in payload)
        throw new Error(
          "error" in payload
            ? payload.error.message
            : "Couldn't submit the test.",
        );
      setResultId(payload.data.resultId);
      setSubmitted(true);
      setRemaining(0);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Couldn't submit the test.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  useEffect(() => {
    submitRef.current = performSubmit;
    saveRef.current = queueSave;
  });

  useEffect(() => {
    if (submitted || submitting) return;
    const timer = window.setInterval(() => {
      const active = attempt.questions[currentRef.current];
      if (active) {
        const nextAnswer = {
          ...answersRef.current[active.id],
          timeSpentSeconds: answersRef.current[active.id].timeSpentSeconds + 1,
        };
        answersRef.current = { ...answersRef.current, [active.id]: nextAnswer };
        dirtyAnswers.current.add(active.id);
        timingTicks.current += 1;
        if (timingTicks.current % 15 === 0) saveRef.current(active.id);
      }
      setRemaining((value) => {
        const next = Math.max(0, value - 1);
        if (next === 0) {
          window.clearInterval(timer);
          void submitRef.current(true);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt.questions, attempt.remainingSeconds, submitted, submitting]);
  useEffect(() => {
    if (submitted) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitted]);

  const courseQuery = courseSlug
    ? `?course=${encodeURIComponent(courseSlug)}`
    : "";
  const courseTestsHref = courseSlug
    ? `/dashboard/courses/${encodeURIComponent(courseSlug)}?view=tests`
    : "/dashboard/courses";
  if (submitted)
    return (
      <section className="grid min-h-[26rem] place-items-center content-center gap-3 rounded-xl border border-[#e1dfdc] bg-white px-8 py-12 text-center">
        <div
          className="grid size-16 place-items-center rounded-full bg-[#e8f7ed] text-3xl text-[#167442]"
          aria-hidden="true"
        >
          ✓
        </div>
        <span className="text-[.7rem] font-extrabold tracking-[.14em] text-prep-orange">
          ATTEMPT SUBMITTED
        </span>
        <h1 className="m-0 text-[clamp(2rem,4vw,2.5rem)] tracking-[-.04em]">
          Your result is ready
        </h1>
        <p className="m-0 max-w-[38rem] text-[.86rem] leading-relaxed text-[#687077]">
          Your score, section analysis and answer explanations are available
          now.
        </p>
        <Link
          className="mt-2 inline-flex min-h-10 items-center justify-center rounded-[.4rem] bg-prep-orange px-5 py-2 text-[.78rem] font-bold text-white hover:bg-prep-orange-dark"
          href={
            resultId ? `/results/${resultId}${courseQuery}` : courseTestsHref
          }
        >
          View result
        </Link>
      </section>
    );
  if (!question)
    return (
      <section className="grid min-h-80 place-items-center content-center gap-4 rounded-xl border border-dashed border-[#d9d6d2] bg-white p-8 text-center">
        <h1 className="m-0 text-xl">This paper has no questions</h1>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-[.4rem] bg-prep-orange px-5 py-2 text-[.78rem] font-bold text-white hover:bg-prep-orange-dark"
          href={courseTestsHref}
        >
          Back to course
        </Link>
      </section>
    );
  const answer = answers[question.id];
  return (
    <div className="mx-auto grid w-full max-w-[1060px] gap-3">
      <header className="flex min-h-[3.75rem] items-center justify-between gap-8 border-b border-[#e5e2de] pb-[.65rem] max-[700px]:items-start max-[420px]:items-center max-[420px]:gap-[.65rem]">
        <div className="min-w-0">
          <span className="sr-only">{attempt.examName}</span>
          <h1 className="m-0 text-[1.4rem] leading-[1.15] tracking-[-.04em] break-words max-[700px]:text-[1.25rem] max-[420px]:text-[1.15rem]">
            {attempt.title}
          </h1>
        </div>
        <div
          className={`grid min-w-[7.25rem] shrink-0 justify-items-center rounded-[.55rem] border px-3 py-[.45rem] max-[420px]:min-w-[6.5rem] max-[420px]:px-[.55rem] ${remaining < 300 ? "border-[#efaaa2] bg-[#fff0ed] text-[#c62e1f]" : "border-[#ffb89e] bg-[#fffaf7] text-[#e44612]"}`}
          role="timer"
          aria-label={`${formatTime(remaining)} remaining`}
        >
          <strong className="text-[1.15rem] leading-[1.15] [font-variant-numeric:tabular-nums]">
            {formatTime(remaining)}
          </strong>
          <small className="mt-[.2rem] text-[.63rem] font-extrabold tracking-[.14em] text-[#666d72]">
            Time remaining
          </small>
        </div>
      </header>
      {error && (
        <div
          className="rounded-[.5rem] border border-[#f4aaa4] bg-[#fff1f0] px-4 py-3 text-[.78rem] text-[#a62a24]"
          role="alert"
        >
          {error}
        </div>
      )}
      <nav
        className="flex gap-[.45rem] overflow-x-auto"
        aria-label="Test sections"
      >
        {attempt.sections
          .filter((item) =>
            attempt.questions.some(
              (questionItem) => questionItem.sectionId === item.id,
            ),
          )
          .map((item) => {
            const index = attempt.questions.findIndex(
              (questionItem) => questionItem.sectionId === item.id,
            );
            const count = attempt.questions.filter(
              (questionItem) => questionItem.sectionId === item.id,
            ).length;
            return (
              <button
                type="button"
                className={`min-h-[2.35rem] min-w-[8.5rem] shrink-0 cursor-pointer whitespace-nowrap rounded-[.42rem] border px-[.9rem] py-[.45rem] text-[.74rem] font-bold ${section?.id === item.id ? "border-[#ec480f] bg-[#ec480f] text-white" : "border-[#e1dfdc] bg-[#f5f5f4] text-[#25292d] hover:border-[#ec480f]"}`}
                onClick={() => goToQuestion(index)}
                key={item.id}
              >
                {item.title} ({count})
              </button>
            );
          })}
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)_18.5rem] items-stretch gap-3 max-[900px]:grid-cols-1">
        <section
          className="flex min-h-[31rem] flex-col rounded-[.5rem] border border-[#e1dfdc] bg-white p-[1.15rem]"
          aria-labelledby={`question-${question.id}-heading`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#ece9e5] pb-[.8rem] font-mono text-[.78rem] font-extrabold tracking-[.08em] text-[#646b71] uppercase">
            <span>
              Question {sectionPosition + 1} of {sectionQuestions.length}
            </span>
            <b className="rounded-[.35rem] bg-[#e9f6ee] px-[.55rem] py-1 text-[.68rem] text-[#24744f]">
              +{question.marks} mark{question.marks === "1" ? "" : "s"}
            </b>
          </div>
          <h2
            className="my-[1.1rem] text-[1rem] leading-[1.55] break-words"
            id={`question-${question.id}-heading`}
          >
            {question.stem}
          </h2>
          {question.imageUrl && (
            <Image
              className="my-4 block h-auto max-h-[28rem] w-full rounded-xl border border-[#e1dfdc] bg-[#f7f9fa] object-contain"
              src={question.imageUrl}
              alt={`Question ${current + 1} illustration`}
              width={960}
              height={540}
              sizes="(max-width: 900px) 100vw, 700px"
              loader={externalImageLoader}
              unoptimized
            />
          )}
          <p className="mt-[-.55rem] mb-4 text-[.7rem] text-[#8a8e92]">
            {Number(question.negativeMarks) > 0
              ? `−${question.negativeMarks} mark for an incorrect answer`
              : "No negative marking"}
          </p>
          {(question.type === "SINGLE_CHOICE" ||
            question.type === "MULTIPLE_CHOICE") && (
            <div className="grid gap-[.65rem]">
              {question.options.map((option, index) => {
                const checked = answer.selectedOptionIds.includes(option.id);
                return (
                  <label
                    className={`grid min-h-[3.15rem] cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-[.7rem] rounded-[.42rem] bg-white px-3 py-[.65rem] ${checked ? "border-2 border-[#ec4b16] bg-[#fffaf7]" : "border border-[#dcdddf] hover:border-[#8c8f93]"}`}
                    key={option.id}
                  >
                    <input
                      className="absolute opacity-0"
                      type={
                        question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"
                      }
                      name={`question-${question.id}`}
                      checked={checked}
                      onChange={() => {
                        const selectedOptionIds =
                          question.type === "SINGLE_CHOICE"
                            ? [option.id]
                            : checked
                              ? answer.selectedOptionIds.filter(
                                  (id) => id !== option.id,
                                )
                              : [...answer.selectedOptionIds, option.id];
                        updateAnswer(question.id, { selectedOptionIds });
                      }}
                    />
                    <strong
                      className={`grid size-[1.8rem] place-items-center rounded-full border text-[.75rem] ${checked ? "border-[#ec4b16] bg-[#ec4b16] text-white" : "border-[#c8cacc] bg-[#f6f6f5] text-[#33383c]"}`}
                    >
                      {String.fromCharCode(65 + index)}
                    </strong>
                    <span className="min-w-0 text-[.86rem] break-words">
                      {option.body}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {question.type === "NUMERIC" && (
            <label className="mt-2 grid gap-2 text-[.78rem] font-semibold">
              <span>Numeric answer</span>
              <div>
                <input
                  className="h-12 w-full rounded-[.55rem] border border-[#bdc9d5] bg-white px-3 py-2 outline-none focus:border-[#087f8c] focus:ring-3 focus:ring-[#087f8c17]"
                  inputMode="decimal"
                  value={answer.numericAnswer ?? ""}
                  onChange={(event) =>
                    updateAnswer(
                      question.id,
                      { numericAnswer: event.target.value },
                      false,
                    )
                  }
                  onBlur={() => queueSave(question.id)}
                />
              </div>
            </label>
          )}
          {question.type === "TEXT" && (
            <label className="mt-2 grid gap-2 text-[.78rem] font-semibold">
              <span>Written answer</span>
              <textarea
                className="w-full resize-y rounded-[.6rem] border border-[#bdc9d5] bg-white p-[.85rem] text-[.82rem] leading-[1.55] outline-none focus:border-[#087f8c] focus:ring-3 focus:ring-[#087f8c17]"
                rows={7}
                maxLength={10_000}
                value={answer.textAnswer ?? ""}
                onChange={(event) =>
                  updateAnswer(
                    question.id,
                    { textAnswer: event.target.value },
                    false,
                  )
                }
                onBlur={() => queueSave(question.id)}
              />
            </label>
          )}
          <div className="mt-auto flex items-center justify-between gap-5 py-4 max-[500px]:items-start max-[500px]:flex-col">
            <button
              className="flex cursor-pointer items-center gap-[.4rem] border-0 bg-transparent p-0 text-[.74rem] font-semibold text-[#343a3f] [&_svg]:size-4"
              type="button"
              onClick={() =>
                updateAnswer(question.id, {
                  selectedOptionIds: [],
                  textAnswer: null,
                  numericAnswer: null,
                })
              }
            >
              <UiIcon name="clear" />
              Clear response
            </button>
            <label
              className={`flex cursor-pointer items-center gap-[.4rem] text-[.74rem] font-semibold [&_svg]:size-4 ${answer.markedForReview ? "text-[#6b43c3]" : "text-[#343a3f]"}`}
            >
              <input
                className="sr-only"
                type="checkbox"
                checked={answer.markedForReview}
                onChange={(event) =>
                  updateAnswer(question.id, {
                    markedForReview: event.target.checked,
                  })
                }
              />
              <UiIcon name="review" />
              <span>
                {answer.markedForReview
                  ? "Marked for review"
                  : "Mark for review"}
              </span>
            </label>
          </div>
          <footer className="grid grid-cols-[auto_1fr_auto] items-center gap-[.8rem] border-t border-[#ece9e5] pt-[.9rem] max-[700px]:grid-cols-2">
            <button
              className="min-h-10 min-w-36 cursor-pointer rounded-[.38rem] border border-[#c8c9ca] bg-white px-4 py-2 text-[.75rem] font-bold text-[#4d5459] hover:bg-[#f5f5f4] disabled:cursor-not-allowed disabled:opacity-55 max-[700px]:min-w-0"
              disabled={current === 0}
              onClick={() => goToQuestion(current - 1)}
            >
              ← Previous
            </button>
            <span
              className="text-center text-[.7rem] text-[#6b7277] max-[700px]:col-span-full max-[700px]:col-start-1 max-[700px]:row-start-1"
              aria-live="polite"
            >
              {saving ? "Saving…" : answer.savedAt ? "Saved" : "Not answered"}
            </span>
            {current < attempt.questions.length - 1 ? (
              <button
                className="min-h-10 min-w-36 cursor-pointer rounded-[.38rem] border border-prep-orange bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark max-[700px]:min-w-0"
                onClick={() => goToQuestion(current + 1)}
              >
                Save & next →
              </button>
            ) : (
              <button
                className="min-h-10 min-w-36 cursor-pointer rounded-[.38rem] border border-prep-orange bg-prep-orange px-4 py-2 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-55 max-[700px]:min-w-0"
                onClick={() => void performSubmit()}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Review & submit"}
              </button>
            )}
          </footer>
        </section>
        <aside className="sticky top-24 h-fit min-h-0 rounded-[.5rem] border border-[#e1dfdc] bg-white p-4 max-[900px]:static">
          <div className="mb-[.8rem]">
            <div>
              <h2 className="m-0 text-[1rem]">Question Palette</h2>
              <small className="text-[.68rem] text-[#7c8287]">
                {answeredCount}/{attempt.questions.length} answered overall
              </small>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-[.55rem] text-[.66rem] text-[#555c62] [&_span]:flex [&_span]:items-center [&_span]:gap-[.4rem] [&_i]:size-[.7rem] [&_i]:rounded-full [&_i]:border">
            <span>
              <i className="border-[#3bb36b] bg-[#3bb36b]" />
              Answered
            </span>
            <span>
              <i className="border-[#ef4c4c] bg-[#ef4c4c]" />
              Not answered
            </span>
            <span>
              <i className="border-[#7048d8] bg-[#7048d8]" />
              Marked for review
            </span>
            <span>
              <i className="border-[#c7c9cb] bg-white" />
              Not visited
            </span>
          </div>
          <div className="grid grid-cols-5 gap-[.55rem] max-[900px]:grid-cols-8 max-[700px]:grid-cols-5">
            {sectionQuestions.map(({ item, index }, sectionIndex) => {
              const itemAnswer = answers[item.id];
              const state = itemAnswer.markedForReview
                ? "review"
                : isAnswered(item, itemAnswer)
                  ? "answered"
                  : visited.has(item.id)
                    ? "not-answered"
                    : "not-visited";
              return (
                <button
                  className={`aspect-square min-w-0 cursor-pointer rounded-[.35rem] border text-[.72rem] font-extrabold ${paletteStateClass(state, index === current)}`}
                  key={item.id}
                  aria-label={`Question ${sectionIndex + 1}: ${state.replaceAll("-", " ")}`}
                  aria-current={index === current ? "true" : undefined}
                  onClick={() => goToQuestion(index)}
                >
                  {sectionIndex + 1}
                </button>
              );
            })}
          </div>
          <button
            className="mt-[2.2rem] w-full cursor-pointer rounded-[.38rem] border border-prep-orange bg-prep-orange px-4 py-3 text-[.75rem] font-bold text-white hover:bg-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-55"
            disabled={submitting}
            onClick={() => void performSubmit()}
          >
            {submitting ? "Submitting…" : "Submit test"}
          </button>
          <small className="mt-[.65rem] flex items-center justify-center gap-[.35rem] text-center text-[.64rem] text-[#767d82] [&_svg]:size-4">
            <UiIcon name="save" />
            {saving ? "Saving your answers…" : "Answers are auto-saved"}
          </small>
        </aside>
      </div>
    </div>
  );
}
