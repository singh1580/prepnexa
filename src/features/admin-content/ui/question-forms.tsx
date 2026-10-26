"use client";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/features/auth/ui/field";
import { UiIcon } from "@/components/ui-icon";
import {
  adminCard,
  adminControl,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

const questionField =
  "grid gap-[0.38rem] text-[0.76rem] font-bold text-[#596168]";
const questionTextarea =
  "w-full resize-y rounded-[0.45rem] border border-[#cacac5] bg-white p-3 font-normal outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]";
const questionGrid = "grid grid-cols-2 gap-4 max-[760px]:grid-cols-1";
const questionError =
  "rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]";
class AdminContentApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT";
type Option = {
  stableKey: string;
  body: string;
  isCorrect: boolean;
  sortOrder: number;
};
type EditableQuestion = {
  id: string;
  type: QuestionType;
  stem: string;
  imageUrl?: string | null;
  explanation: string | null;
  marks: string;
  negativeMarks: string;
  difficulty: string;
  options: Option[];
  answerConfig: Record<string, unknown>;
};

function errorMessage(error: unknown) {
  return error instanceof AdminContentApiError
    ? error.message
    : "Couldn't save this question. Please try again.";
}

const blankOptions = () =>
  ["A", "B", "C", "D"].map((stableKey, sortOrder) => ({
    stableKey,
    body: "",
    isCorrect: false,
    sortOrder,
  }));

export function QuestionForm({
  question,
  sectionId,
  onAdded,
  onCancel,
  returnTo,
}: {
  question?: EditableQuestion;
  sectionId: string;
  onAdded?: () => void;
  onCancel?: () => void;
  returnTo: string;
}) {
  const router = useRouter();
  const formId = useId();
  const [type, setType] = useState<QuestionType>(
    question?.type ?? "SINGLE_CHOICE",
  );
  const [options, setOptions] = useState<Option[]>(
    question?.options.length ? question.options : blankOptions(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answer = question?.answerConfig ?? {};

  function changeOption(index: number, patch: Partial<Option>) {
    setOptions((current) =>
      current.map((option, position) => {
        if (position !== index)
          return patch.isCorrect && type === "SINGLE_CHOICE"
            ? { ...option, isCorrect: false }
            : option;
        return { ...option, ...patch };
      }),
    );
  }
  function addOption() {
    setOptions((current) => [
      ...current,
      {
        stableKey: String.fromCharCode(65 + current.length),
        body: "",
        isCorrect: false,
        sortOrder: current.length,
      },
    ]);
  }
  function removeOption(index: number) {
    setOptions((current) =>
      current
        .filter((_, position) => position !== index)
        .map((option, sortOrder) => ({
          ...option,
          stableKey: String.fromCharCode(65 + sortOrder),
          sortOrder,
        })),
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const choice = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
    const correctCount = options.filter((option) => option.isCorrect).length;
    if (type === "SINGLE_CHOICE" && correctCount !== 1) {
      setError("Select exactly one correct answer before saving.");
      return;
    }
    if (type === "MULTIPLE_CHOICE" && correctCount < 2) {
      setError("Select at least two correct answers before saving.");
      return;
    }
    setBusy(true);
    const numericRaw = String(data.get("numericAnswer") ?? "").trim();
    const payload = {
      type,
      stem: String(data.get("stem")),
      imageUrl: String(data.get("imageUrl") ?? ""),
      explanation: String(data.get("explanation") ?? ""),
      marks: Number(data.get("marks")),
      negativeMarks: Number(data.get("negativeMarks")),
      difficulty: String(data.get("difficulty")),
      options: choice
        ? options.map((option) => ({ ...option, body: option.body.trim() }))
        : [],
      numericAnswer:
        type === "NUMERIC" && numericRaw ? Number(numericRaw) : null,
      numericTolerance:
        type === "NUMERIC" ? Number(data.get("numericTolerance") ?? 0) : 0,
      acceptedAnswers:
        type === "TEXT"
          ? String(data.get("acceptedAnswers") ?? "")
              .split(/\n|,/)
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
      caseSensitive: type === "TEXT" && data.get("caseSensitive") === "on",
    };
    try {
      {
        const response = await fetch(
          `/api/admin/tests/sections/${sectionId}/${question ? `questions/${question.id}` : "new-question"}`,
          {
            method: question ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const result = await response.json();
        if (!response.ok || result.error)
          throw new AdminContentApiError(
            result.error?.code ?? "REQUEST_FAILED",
            result.error?.message ?? "Could not add this question.",
          );
        onAdded?.();
        if (returnTo) router.push(returnTo);
        router.refresh();
        setBusy(false);
        return;
      }
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  const numericValue = typeof answer.value === "number" ? answer.value : "";
  const tolerance = typeof answer.tolerance === "number" ? answer.tolerance : 0;
  const accepted = Array.isArray(answer.acceptedAnswers)
    ? answer.acceptedAnswers.join("\n")
    : "";
  return (
    <form className={`${adminCard} max-w-[70rem]`} onSubmit={submit}>
      <fieldset className="m-0 grid gap-5 border-0 p-0" disabled={busy}>
        <div className={questionGrid}>
          <label className={questionField}>
            <span>Question type</span>
            <select
              className={adminControl}
              value={type}
              onChange={(event) => {
                setType(event.target.value as QuestionType);
                setOptions((current) =>
                  current.map((option) => ({ ...option, isCorrect: false })),
                );
              }}
            >
              <option value="SINGLE_CHOICE">Single choice</option>
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="NUMERIC">Numeric answer</option>
              <option value="TEXT">Text answer</option>
            </select>
          </label>
        </div>
        <label className={questionField}>
          <span>Question</span>
          <textarea
            className={`${questionTextarea} min-h-36`}
            name="stem"
            defaultValue={question?.stem}
            required
            minLength={10}
            maxLength={20000}
            rows={6}
            placeholder="Write a complete, unambiguous question."
          />
        </label>
        <label className={questionField}>
          <span>Question image URL (optional)</span>
          <input
            className={adminControl}
            name="imageUrl"
            type="url"
            defaultValue={question?.imageUrl ?? ""}
            maxLength={2048}
            placeholder="https://…/diagram.png"
          />
          <small className="font-normal leading-relaxed text-prep-muted">
            Add a diagram, chart or image-based question using a secure URL.
          </small>
        </label>
        <div className="grid grid-cols-3 gap-4 max-[760px]:grid-cols-1">
          <Field
            id={`${formId}-question-marks`}
            label="Marks"
            name="marks"
            type="number"
            min={0.01}
            step="0.01"
            max={1000}
            defaultValue={question?.marks ?? "1"}
            required
          />
          <Field
            id={`${formId}-question-negative`}
            label="Negative marks"
            name="negativeMarks"
            type="number"
            min={0}
            step="0.01"
            max={1000}
            defaultValue={question?.negativeMarks ?? "0"}
            required
          />
          <label className={questionField}>
            <span>Difficulty</span>
            <select
              className={adminControl}
              name="difficulty"
              defaultValue={question?.difficulty ?? "MEDIUM"}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
        </div>
        {(type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") && (
          <section className="rounded-[0.7rem] border border-[#d9e8eb] bg-[#f6fafb] p-[1.2rem]">
            <div className="mb-4 flex items-center justify-between gap-4 max-[650px]:items-start">
              <div>
                <span className="eyebrow">ANSWER OPTIONS</span>
                <h2 className="mt-1 text-[1.15rem] font-bold">
                  Mark the correct answer
                </h2>
                <p className="mt-1 text-sm text-prep-muted">
                  {type === "SINGLE_CHOICE"
                    ? "Select one correct answer."
                    : "Select every correct answer (at least two)."}
                </p>
              </div>
              {type === "MULTIPLE_CHOICE" && options.length < 8 && (
                <button
                  className={adminSecondaryButton}
                  type="button"
                  onClick={addOption}
                >
                  Add option
                </button>
              )}
            </div>
            {options.map((option, index) => (
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-[0.8rem] border-t border-[#dce7e9] py-3 first:border-t-0 max-[650px]:grid-cols-[auto_minmax(0,1fr)]"
                key={option.stableKey}
              >
                <label className="flex min-h-12 cursor-pointer items-center gap-2">
                  <input
                    className="peer sr-only"
                    type={type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                    name="correct-option"
                    checked={option.isCorrect}
                    onChange={(event) =>
                      changeOption(index, { isCorrect: event.target.checked })
                    }
                  />
                  <span className="grid min-h-9 min-w-9 place-items-center rounded-full bg-prep-navy px-2 text-xs font-extrabold text-white peer-focus-visible:ring-2 peer-focus-visible:ring-prep-orange peer-focus-visible:ring-offset-2 peer-checked:bg-prep-orange">
                    {option.stableKey} · Correct
                  </span>
                </label>
                <label className={questionField}>
                  <span>Option {option.stableKey}</span>
                  <input
                    className={adminControl}
                    value={option.body}
                    onChange={(event) =>
                      changeOption(index, { body: event.target.value })
                    }
                    required
                    maxLength={4000}
                  />
                </label>
                {type === "MULTIPLE_CHOICE" && options.length > 2 && (
                  <button
                    className="inline-flex items-center gap-1 border-0 bg-transparent px-1 py-2 text-[0.7rem] font-bold text-[#ad3028] disabled:cursor-not-allowed disabled:opacity-40 max-[650px]:col-start-2 max-[650px]:justify-self-start [&_svg]:size-4"
                    type="button"
                    onClick={() => removeOption(index)}
                  >
                    <UiIcon name="trash" /> Remove
                  </button>
                )}
              </div>
            ))}
          </section>
        )}
        {type === "NUMERIC" && (
          <div className={questionGrid}>
            <Field
              id={`${formId}-numeric-answer`}
              label="Accepted answer"
              name="numericAnswer"
              type="number"
              step="any"
              defaultValue={numericValue}
              required
            />
            <Field
              id={`${formId}-numeric-tolerance`}
              label="Allowed tolerance (±)"
              name="numericTolerance"
              type="number"
              step="any"
              min={0}
              max={1000}
              defaultValue={tolerance}
              required
            />
          </div>
        )}
        {type === "TEXT" && (
          <>
            <label className={questionField}>
              <span>Accepted answers</span>
              <textarea
                className={questionTextarea}
                name="acceptedAnswers"
                defaultValue={accepted}
                required
                rows={4}
                placeholder="One accepted answer per line"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[0.76rem] font-bold text-prep-ink [&_input]:accent-prep-orange">
              <input
                name="caseSensitive"
                type="checkbox"
                defaultChecked={answer.caseSensitive === true}
              />{" "}
              Answers are case-sensitive
            </label>
          </>
        )}
        <label className={questionField}>
          <span>Explanation</span>
          <textarea
            className={questionTextarea}
            name="explanation"
            defaultValue={question?.explanation ?? ""}
            maxLength={20000}
            rows={5}
            placeholder="Explain why the answer is correct."
          />
        </label>
        <div className="flex flex-wrap gap-[0.7rem]">
          <button className={adminPrimaryButton} type="submit">
            {busy
              ? "Saving…"
              : question
                ? "Save changes to this test"
                : "Add question to this test"}
          </button>
          <button
            className={adminSecondaryButton}
            type="button"
            onClick={() => (onCancel ? onCancel() : router.push(returnTo))}
          >
            Cancel
          </button>
        </div>
      </fieldset>
      {error && (
        <p className={`${questionError} mt-4`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
