"use client";
import Link from "next/link";
import { testCategoryLabels, type TestCategory } from "../categories";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddTestQuestions } from "./add-questions";
import { Field } from "@/features/auth/ui/field";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";
import { UiIcon } from "@/components/ui-icon";
import {
  adminCard,
  adminControl,
  adminEmptyState,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

const testField = "grid gap-[0.38rem] text-[0.76rem] font-bold text-[#596168]";
const testTextarea =
  "min-h-28 w-full resize-y rounded-[0.45rem] border border-[#cacac5] bg-white p-3 font-normal outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]";
const testCheck =
  "flex cursor-pointer items-center gap-2 text-[0.76rem] font-semibold [&_input]:accent-prep-orange";
const testError =
  "rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]";
const testTextButton =
  "inline-flex items-center gap-1 border-0 bg-transparent px-1 py-2 text-[0.7rem] font-bold text-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4";
const stepsClass =
  "grid list-none grid-cols-3 p-0 text-[0.7rem] max-[520px]:min-w-[30rem] [&_li]:relative [&_li]:flex [&_li]:items-center [&_li]:gap-2 [&_li:not(:last-child)]:after:absolute [&_li:not(:last-child)]:after:top-4 [&_li:not(:last-child)]:after:right-2 [&_li:not(:last-child)]:after:left-8 [&_li:not(:last-child)]:after:h-px [&_li:not(:last-child)]:after:bg-[#e3e1de] [&_li>b]:relative [&_li>b]:z-[1] [&_li>b]:grid [&_li>b]:size-8 [&_li>b]:shrink-0 [&_li>b]:place-items-center [&_li>b]:rounded-full [&_li>b]:border [&_li>b]:text-[0.72rem] [&_li>span]:relative [&_li>span]:z-[1] [&_li>span]:grid [&_li>span]:bg-white [&_li>span]:pr-2 [&_li_small]:text-[0.61rem] max-[760px]:[&_li_small]:hidden [&_li_strong]:text-[0.72rem]";
const stepClass = (active: boolean) =>
  active
    ? "text-[#25292d] [&>b]:border-prep-orange [&>b]:bg-prep-orange [&>b]:text-white [&_strong]:text-[#25292d]"
    : "text-[#92969a] [&>b]:border-[#dedbd7] [&>b]:bg-white [&_strong]:text-[#60666b]";

type TestDetails = {
  category: TestCategory | null;
  id: string;
  title: string;
  mode: "PRACTICE" | "MOCK";
  durationMinutes: number;
  instructions: string | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};
type Section = {
  id: string;
  title: string;
  durationMinutes: number | null;
  sortOrder: number;
  questions: {
    questionId: string;
    stem: string;
    type: string;
    sortOrder: number;
    explanation: string | null;
    marks: string;
    negativeMarks: string;
    options: { body: string; correct: boolean }[];
    answerConfig: Record<string, unknown>;
  }[];
};
type Question = {
  id: string;
  stem: string;
  topicName: string;
  subjectName: string;
};

class RequestError extends Error {}
async function request<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) {
  const response = await fetch(`/api/admin/tests/${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  if (!response.ok || "error" in payload)
    throw new RequestError(
      "error" in payload
        ? payload.error.message
        : "Couldn't complete this request.",
    );
  return payload.data;
}
function payload(data: FormData) {
  return {
    title: String(data.get("title")),
    mode: String(data.get("mode")),
    category: data.get("category") || null,
    durationMinutes: Number(data.get("durationMinutes")),
    instructions: String(data.get("instructions") ?? ""),
    maxAttempts: Number(data.get("maxAttempts")),
    shuffleQuestions: data.get("shuffleQuestions") === "on",
    shuffleOptions: data.get("shuffleOptions") === "on",
  };
}

function CategoryField({
  value = "FULL_MOCK",
}: {
  value?: TestCategory | null;
}) {
  return (
    <label className={testField}>
      <span>Test type</span>
      <select
        className={adminControl}
        name="category"
        defaultValue={value ?? ""}
        required
      >
        {!value && (
          <option value="" disabled>
            Choose a test type
          </option>
        )}
        {Object.entries(testCategoryLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <small className="font-normal leading-relaxed text-prep-muted">
        Subject test: one focused section. Topic set: one focused practice set.
        Full mock: combine multiple sections as needed.
      </small>
    </label>
  );
}

export function TestCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      const result = await request<{ id: string }>("", "POST", {
        ...payload(data),
        sections: String(data.get("sections") ?? "")
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
      });
      router.push(`/admin/tests/${result.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't create the test.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="overflow-x-auto">
        <ol className={stepsClass} aria-label="Test creation steps">
          <li className={stepClass(true)}>
            <b>1</b>
            <span>
              <strong>Test setup</strong>
              <small>Format and rules</small>
            </span>
          </li>
          <li className={stepClass(false)}>
            <b>2</b>
            <span>
              <strong>Sections</strong>
              <small>Build paper structure</small>
            </span>
          </li>
          <li className={stepClass(false)}>
            <b>3</b>
            <span>
              <strong>Questions</strong>
              <small>Manual or spreadsheet</small>
            </span>
          </li>
        </ol>
      </div>
      <div>
        <span className="eyebrow">NEW ASSESSMENT</span>
        <h3 className="mt-1 text-lg font-bold">Test setup</h3>
        <p className="mt-1 text-sm text-prep-muted">
          Set the test rules and initial sections. The next workspace keeps
          settings, sections and questions together.
        </p>
      </div>
      <fieldset
        className="grid grid-cols-2 gap-[0.85rem] border-0 p-0 max-[760px]:grid-cols-1"
        disabled={busy}
      >
        <label className={testField}>
          <span>Format</span>
          <select
            className={adminControl}
            name="mode"
            defaultValue="MOCK"
            required
          >
            <option value="MOCK">Mock test</option>
            <option value="PRACTICE">Practice set</option>
          </select>
        </label>
        <CategoryField />
        <Field
          id="new-test-title"
          label="Test title"
          name="title"
          required
          minLength={3}
          maxLength={200}
          placeholder="Full-length mock test 01"
        />
        <label className={`${testField} col-span-full`}>
          <span>Sections</span>
          <textarea
            className={testTextarea}
            name="sections"
            rows={4}
            defaultValue="General"
            required
          />
          <small className="font-normal text-prep-muted">
            Enter one section per line. You can edit sections and add questions
            after creation.
          </small>
        </label>
        <div>
          <Field
            id="new-test-duration"
            label="Duration (minutes)"
            name="durationMinutes"
            type="number"
            min={1}
            max={600}
            defaultValue={60}
            required
          />
        </div>
        <Field
          id="new-test-attempts"
          label="Maximum attempts"
          name="maxAttempts"
          type="number"
          min={1}
          max={100}
          defaultValue={1}
          required
        />
        <label className={testCheck}>
          <input name="shuffleQuestions" type="checkbox" defaultChecked />{" "}
          Shuffle questions
        </label>
        <label className={testCheck}>
          <input name="shuffleOptions" type="checkbox" defaultChecked /> Shuffle
          options
        </label>
        <label className={`${testField} col-span-full`}>
          <span>Instructions</span>
          <textarea
            className={testTextarea}
            name="instructions"
            maxLength={10000}
            rows={4}
          />
        </label>
        <div className="col-span-full flex items-center justify-between gap-4 border-t border-prep-line pt-4 max-[520px]:flex-col max-[520px]:items-stretch">
          <span className="text-[0.72rem] text-prep-muted">
            Save the test here, then add it to a product package when it is
            ready for students.
          </span>
          <button className={adminPrimaryButton} type="submit">
            {busy ? "Creating…" : "Create & continue to questions →"}
          </button>
        </div>
      </fieldset>
      {error && (
        <p className={testError} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function TestBuilder({
  test,
  sections,
  questions,
  canManage,
  canCreate,
}: {
  test: TestDetails;
  sections: Section[];
  questions: Question[];
  canManage: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const editable = canManage;
  const totalQuestions = sections.reduce(
    (total, section) => total + section.questions.length,
    0,
  );
  async function mutate(
    event: FormEvent<HTMLFormElement>,
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    bodyBuilder: (data: FormData) => Record<string, unknown>,
    key: string,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(key);
    setError("");
    try {
      await request(path, method, bodyBuilder(new FormData(form)));
      if (method === "POST") form.reset();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't save this change.",
      );
    } finally {
      setBusy("");
    }
  }
  async function remove(path: string) {
    setBusy("remove");
    setError("");
    try {
      await request(path, "DELETE", {});
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't remove this item.",
      );
    } finally {
      setBusy("");
    }
  }
  async function transition(action: "duplicate") {
    setBusy(action);
    setError("");
    try {
      const result = await request<{ id: string }>(
        `${test.id}/${action}`,
        "POST",
        {},
      );
      if (action === "duplicate") router.push(`/admin/tests/${result.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't update the test.",
      );
    } finally {
      setBusy("");
    }
  }
  async function move(section: Section, index: number, offset: number) {
    const questionIds = section.questions.map(
      (question) => question.questionId,
    );
    [questionIds[index], questionIds[index + offset]] = [
      questionIds[index + offset],
      questionIds[index],
    ];
    setBusy("order");
    setError("");
    try {
      await request(`sections/${section.id}/order`, "PATCH", { questionIds });
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't reorder questions.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="grid gap-[1.2rem]">
      <section>
        <div className="overflow-x-auto">
          <ol className={stepsClass} aria-label="Test editor sections">
            <li className={stepClass(true)}>
              <b>1</b>
              <span>
                <strong>Setup</strong>
                <small>Rules and timing</small>
              </span>
            </li>
            <li className={stepClass(true)}>
              <b>2</b>
              <span>
                <strong>Build paper</strong>
                <small>Sections and questions</small>
              </span>
            </li>
            <li className={stepClass(Boolean(totalQuestions))}>
              <b>3</b>
              <span>
                <strong>Review</strong>
                <small>Check final structure</small>
              </span>
            </li>
          </ol>
        </div>
        <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-[0.6rem] border border-prep-line bg-white max-[760px]:grid-cols-2 [&>span]:grid [&>span]:gap-1 [&>span]:border-l [&>span]:border-prep-line [&>span]:p-3 [&>span:first-child]:border-l-0 max-[760px]:[&>span:nth-child(3)]:border-l-0 max-[760px]:[&>span:nth-child(n+3)]:border-t [&_small]:text-[0.65rem] [&_small]:text-prep-muted [&_strong]:text-[0.8rem]">
          <span>
            <small>Format</small>
            <strong>
              {test.mode === "MOCK" ? "Mock test" : "Practice set"}
            </strong>
          </span>
          <span>
            <small>Sections</small>
            <strong>{sections.length}</strong>
          </span>
          <span>
            <small>Questions</small>
            <strong>{totalQuestions}</strong>
          </span>
          <span>
            <small>Duration</small>
            <strong>{test.durationMinutes} min</strong>
          </span>
        </div>
      </section>
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            className={adminSecondaryButton}
            disabled={Boolean(busy)}
            onClick={() => transition("duplicate")}
          >
            Duplicate test
          </button>
        </div>
      )}
      {editable && (
        <details className={`${adminCard} p-5`} id="settings" open>
          <summary className="cursor-pointer font-bold">
            Test settings — duration, instructions and attempts
          </summary>
          <span className="eyebrow mt-4 block">CONFIGURATION</span>
          <h2 className="mt-1 text-lg font-bold">Test settings</h2>
          <form
            className="mt-3"
            onSubmit={(event) =>
              mutate(event, test.id, "PATCH", payload, "settings")
            }
          >
            <fieldset
              className="grid grid-cols-2 gap-x-4 gap-y-3 border-0 p-0 max-[760px]:grid-cols-1"
              disabled={Boolean(busy)}
            >
              <label className={testField}>
                <span>Format</span>
                <select
                  className={adminControl}
                  name="mode"
                  defaultValue={test.mode}
                >
                  <option value="MOCK">Mock test</option>
                  <option value="PRACTICE">Practice set</option>
                </select>
              </label>
              <CategoryField value={test.category} />
              <Field
                id="edit-test-title"
                label="Title"
                name="title"
                defaultValue={test.title}
                required
              />
              <div>
                <Field
                  id="edit-test-duration"
                  label="Duration"
                  name="durationMinutes"
                  type="number"
                  min={1}
                  max={600}
                  defaultValue={test.durationMinutes}
                  required
                />
              </div>
              <Field
                id="edit-test-attempts"
                label="Maximum attempts"
                name="maxAttempts"
                type="number"
                min={1}
                max={100}
                defaultValue={test.maxAttempts}
                required
              />
              <label className={testCheck}>
                <input
                  name="shuffleQuestions"
                  type="checkbox"
                  defaultChecked={test.shuffleQuestions}
                />{" "}
                Shuffle questions
              </label>
              <label className={testCheck}>
                <input
                  name="shuffleOptions"
                  type="checkbox"
                  defaultChecked={test.shuffleOptions}
                />{" "}
                Shuffle options
              </label>
              <label className={`${testField} col-span-full`}>
                <span>Instructions</span>
                <textarea
                  className={testTextarea}
                  name="instructions"
                  defaultValue={test.instructions ?? ""}
                  rows={4}
                />
              </label>
              <button
                className={`${adminPrimaryButton} col-span-full justify-self-end max-[760px]:w-full`}
                type="submit"
              >
                {busy === "settings" ? "Saving…" : "Save settings"}
              </button>
            </fieldset>
          </form>
        </details>
      )}
      <section>
        <div className="mb-4">
          <div>
            <span className="eyebrow">PAPER STRUCTURE</span>
            <h2 className="mt-1 text-xl font-bold">Sections &amp; questions</h2>
            <p className="mt-1 text-sm text-prep-muted">
              Open a section to edit its settings, write questions or import a
              spreadsheet.
            </p>
          </div>
        </div>
        {sections.length ? (
          <div className="grid gap-[0.8rem]">
            {sections.map((section, sectionIndex) => (
              <article
                className="overflow-hidden rounded-[0.6rem] border border-[#e1dfdc] bg-white"
                key={section.id}
              >
                <header className="flex items-center justify-between gap-4 border-b border-[#e8e6e3] bg-[#faf9f7] px-4 py-[0.9rem]">
                  <div>
                    <span className="text-[0.59rem] font-extrabold tracking-[0.08em] text-prep-orange-dark">
                      SECTION {sectionIndex + 1}
                    </span>
                    <h3 className="mt-1 text-[0.92rem] font-bold">
                      {section.title}
                    </h3>
                  </div>
                  <strong className="rounded-full bg-[#fff0e8] px-[0.6rem] py-[0.35rem] text-[0.64rem] text-[#c54318]">
                    {section.questions.length} questions
                  </strong>
                </header>
                {editable && (
                  <details className="mx-4 mt-3 rounded-prep-control border border-prep-line p-3">
                    <summary className="cursor-pointer text-[0.72rem] font-bold text-prep-orange-dark">
                      Edit section settings
                    </summary>
                    <form
                      className="mt-3"
                      onSubmit={(event) =>
                        mutate(
                          event,
                          `sections/${section.id}`,
                          "PATCH",
                          (data) => ({
                            title: String(data.get("title")),
                            durationMinutes: data.get("durationMinutes")
                              ? Number(data.get("durationMinutes"))
                              : null,
                            sortOrder: Number(data.get("sortOrder")) - 1,
                          }),
                          `edit-${section.id}`,
                        )
                      }
                    >
                      <fieldset
                        className="grid grid-cols-3 items-end gap-3 border-0 p-0 max-[760px]:grid-cols-1"
                        disabled={Boolean(busy)}
                      >
                        <Field
                          id={`section-title-${section.id}`}
                          label="Section title"
                          name="title"
                          defaultValue={section.title}
                          required
                        />
                        <Field
                          id={`section-minutes-${section.id}`}
                          label="Section minutes (optional)"
                          name="durationMinutes"
                          type="number"
                          min={1}
                          max={600}
                          defaultValue={section.durationMinutes ?? ""}
                        />
                        <Field
                          id={`section-order-${section.id}`}
                          label="Section order"
                          name="sortOrder"
                          type="number"
                          min={1}
                          defaultValue={sectionIndex + 1}
                          required
                        />
                        <button className={adminSecondaryButton} type="submit">
                          Save section
                        </button>
                      </fieldset>
                    </form>
                  </details>
                )}
                {editable && section.questions.length === 0 && (
                  <button
                    type="button"
                    className={`${testTextButton} mx-4`}
                    disabled={Boolean(busy)}
                    onClick={() => remove(`sections/${section.id}`)}
                  >
                    <UiIcon name="trash" /> Remove empty section
                  </button>
                )}
                <p className="mx-4 mt-3 text-[0.68rem] text-prep-muted">
                  {section.durationMinutes
                    ? `${section.durationMinutes} minutes · `
                    : ""}
                  {section.questions.length
                    ? "Questions are shown in the student exam order below."
                    : "Add the first question manually or import Excel / CSV."}
                </p>
                {section.questions.map((question, index) => (
                  <div
                    className="mx-4 grid grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto_auto] items-center gap-3 border-t border-[#eceae7] py-3 max-[760px]:grid-cols-[2rem_minmax(0,1fr)] max-[760px]:items-start max-[760px]:[&>button]:col-start-2 max-[760px]:[&>a]:col-start-2 max-[760px]:[&>small]:col-start-2"
                    key={question.questionId}
                  >
                    <span className="grid size-[1.8rem] place-items-center rounded-[0.35rem] bg-[#f5f3f0] text-[0.72rem] font-bold text-[#555]">
                      {question.sortOrder + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.73rem] [overflow-wrap:anywhere]">
                        {question.stem}
                      </p>
                      <details className="mt-1 text-[0.68rem] text-prep-muted">
                        <summary className="cursor-pointer font-semibold text-prep-orange-dark">
                          Preview answer & explanation
                        </summary>
                        <p>
                          Marks: {question.marks} · Negative marks:{" "}
                          {question.negativeMarks}
                        </p>
                        {question.options.length > 0 && (
                          <ol type="A">
                            {question.options.map((option, index) => (
                              <li key={index}>
                                {option.body}
                                {option.correct ? " — Correct answer" : ""}
                              </li>
                            ))}
                          </ol>
                        )}
                        {question.type === "NUMERIC" && (
                          <p>
                            Answer: {String(question.answerConfig?.value ?? "")}{" "}
                            · Tolerance:{" "}
                            {String(question.answerConfig?.tolerance ?? 0)}
                          </p>
                        )}
                        {question.type === "TEXT" && (
                          <p>
                            Accepted answers:{" "}
                            {Array.isArray(
                              question.answerConfig?.acceptedAnswers,
                            )
                              ? question.answerConfig.acceptedAnswers.join(", ")
                              : ""}
                          </p>
                        )}
                        <p>{question.explanation || "No explanation added."}</p>
                      </details>
                    </div>
                    <small className="text-[0.6rem] text-prep-muted">
                      {question.type.replaceAll("_", " ")}
                    </small>
                    {editable && (
                      <>
                        {canCreate && (
                          <Link
                            className={testTextButton}
                            href={`/admin/tests/${test.id}/questions/${question.questionId}`}
                          >
                            Edit in this test
                          </Link>
                        )}
                        <button
                          type="button"
                          className={testTextButton}
                          aria-label={`Move question ${index + 1} up`}
                          disabled={Boolean(busy) || index === 0}
                          onClick={() => move(section, index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={testTextButton}
                          aria-label={`Move question ${index + 1} down`}
                          disabled={
                            Boolean(busy) ||
                            index === section.questions.length - 1
                          }
                          onClick={() => move(section, index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={testTextButton}
                          disabled={Boolean(busy)}
                          onClick={() =>
                            remove(
                              `sections/${section.id}/questions/${question.questionId}`,
                            )
                          }
                        >
                          <UiIcon name="trash" /> Remove question
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {editable && canCreate && (
                  <AddTestQuestions sectionId={section.id} />
                )}
                {editable && questions.length > 0 && (
                  <form
                    className="m-4 rounded-[0.6rem] border border-[#bee2e5] bg-[#eef9fa] p-3"
                    onSubmit={(event) =>
                      mutate(
                        event,
                        `sections/${section.id}/questions`,
                        "POST",
                        (data) => ({
                          questionId: String(data.get("questionId")),
                          sortOrder: Number(data.get("sortOrder")),
                        }),
                        `assign-${section.id}`,
                      )
                    }
                  >
                    <fieldset
                      className="grid grid-cols-[minmax(0,1fr)_6rem_auto] items-end gap-3 border-0 p-0 max-[760px]:grid-cols-1"
                      disabled={Boolean(busy)}
                    >
                      <label className={testField}>
                        <span>Reuse an existing question (optional)</span>
                        <select className={adminControl} name="questionId">
                          {questions.map((question) => (
                            <option value={question.id} key={question.id}>
                              {question.subjectName} · {question.topicName} ·{" "}
                              {question.stem.slice(0, 70)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Field
                        id={`assign-order-${section.id}`}
                        label="Order"
                        name="sortOrder"
                        type="number"
                        min={0}
                        defaultValue={section.questions.reduce(
                          (next, question) =>
                            Math.max(next, question.sortOrder + 1),
                          0,
                        )}
                        required
                      />
                      <button className={adminPrimaryButton} type="submit">
                        Assign
                      </button>
                    </fieldset>
                  </form>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className={adminEmptyState}>
            <h2>No sections yet</h2>
            <p>Add a section to start building the paper.</p>
          </div>
        )}
        {editable && (
          <form
            className={`${adminCard} mt-3 p-4`}
            onSubmit={(event) =>
              mutate(
                event,
                `${test.id}/sections`,
                "POST",
                (data) => ({
                  title: String(data.get("title")),
                  durationMinutes: data.get("durationMinutes")
                    ? Number(data.get("durationMinutes"))
                    : null,
                  sortOrder: Number(data.get("sortOrder")) - 1,
                }),
                "section",
              )
            }
          >
            <fieldset
              className="grid grid-cols-[minmax(12rem,1fr)_1fr_auto] items-end gap-[0.8rem] border-0 p-0 max-[760px]:grid-cols-1"
              disabled={Boolean(busy)}
            >
              <Field
                id="new-section-title"
                label="New section"
                name="title"
                defaultValue={sections.length ? "" : "Questions"}
                required
              />
              <div className="grid grid-cols-2 gap-[0.8rem] max-[520px]:grid-cols-1">
                <Field
                  id="new-section-duration"
                  label="Section minutes (optional)"
                  name="durationMinutes"
                  type="number"
                  min={1}
                  max={600}
                />
                <Field
                  id="new-section-order"
                  label="Order"
                  name="sortOrder"
                  type="number"
                  min={1}
                  defaultValue={sections.length + 1}
                  required
                />
              </div>
              <button className={adminSecondaryButton} type="submit">
                {busy === "section" ? "Adding…" : "Add section"}
              </button>
            </fieldset>
          </form>
        )}
      </section>
      {error && (
        <p className={testError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
