"use client";
import Link from "next/link";
import { testCategoryLabels, type TestCategory } from "../categories";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddTestQuestions } from "./add-questions";
import { Field } from "@/features/auth/ui/field";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

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
    <label className="field">
      <span>Test type</span>
      <select name="category" defaultValue={value ?? ""} required>
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
      <small>
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
      const data=new FormData(event.currentTarget);
      const result = await request<{ id: string }>(
        "",
        "POST",
        {...payload(data),sections:String(data.get("sections")??"").split(/\r?\n/).map(value=>value.trim()).filter(Boolean)},
      );
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
    <form className="admin-form test-create-workspace" onSubmit={submit}>
      <ol className="workspace-steps" aria-label="Test creation steps">
        <li className="active"><b>1</b><span><strong>Test setup</strong><small>Format and rules</small></span></li>
        <li><b>2</b><span><strong>Sections</strong><small>Build paper structure</small></span></li>
        <li><b>3</b><span><strong>Questions</strong><small>Manual or spreadsheet</small></span></li>
      </ol>
      <div className="test-create-intro"><span className="eyebrow">NEW ASSESSMENT</span><h3>Test setup</h3><p>Set the test rules and initial sections. The next workspace keeps settings, sections and questions together.</p></div>
      <fieldset disabled={busy}>
        <label className="field">
          <span>Format</span>
          <select name="mode" defaultValue="MOCK" required>
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
        <label className="field"><span>Sections</span><textarea name="sections" rows={4} defaultValue="General" required/><small>Enter one section per line. You can edit sections and add questions after creation.</small></label>
        <div className="question-grid">
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
        <label className="check-row">
          <input name="shuffleQuestions" type="checkbox" defaultChecked />{" "}
          Shuffle questions
        </label>
        <label className="check-row">
          <input name="shuffleOptions" type="checkbox" defaultChecked /> Shuffle
          options
        </label>
        <label className="field">
          <span>Instructions</span>
          <textarea name="instructions" maxLength={10000} rows={4} />
        </label>
        <div className="dialog-form-footer"><span>Save the test here, then add it to a product package when it is ready for students.</span><button className="button" type="submit">{busy ? "Creating…" : "Create & continue to questions →"}</button></div>
      </fieldset>
      {error && (
        <p className="notice danger" role="alert">
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
  const totalQuestions = sections.reduce((total, section) => total + section.questions.length, 0);
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
    <div className="test-builder">
      <section className="test-workspace-overview">
        <ol className="workspace-steps" aria-label="Test editor sections">
          <li className="active"><b>1</b><span><strong>Setup</strong><small>Rules and timing</small></span></li>
          <li className="active"><b>2</b><span><strong>Build paper</strong><small>Sections and questions</small></span></li>
          <li className={totalQuestions ? "active" : ""}><b>3</b><span><strong>Review</strong><small>Check final structure</small></span></li>
        </ol>
        <div className="test-workspace-stats"><span><small>Format</small><strong>{test.mode === "MOCK" ? "Mock test" : "Practice set"}</strong></span><span><small>Sections</small><strong>{sections.length}</strong></span><span><small>Questions</small><strong>{totalQuestions}</strong></span><span><small>Duration</small><strong>{test.durationMinutes} min</strong></span></div>
      </section>
      {canManage && (
        <div className="form-actions test-workspace-actions">
          <button
            type="button"
            className="button secondary"
            disabled={Boolean(busy)}
            onClick={() => transition("duplicate")}
          >
            Duplicate test
          </button>
        </div>
      )}
      {editable && (
        <details className="admin-card test-settings-card" id="settings" open>
          <summary>Test settings — duration, instructions and attempts</summary>
          <span className="eyebrow">CONFIGURATION</span>
          <h2>Test settings</h2>
          <form
            className="admin-form"
            onSubmit={(event) =>
              mutate(event, test.id, "PATCH", payload, "settings")
            }
          >
            <fieldset disabled={Boolean(busy)}>
              <label className="field">
                <span>Format</span>
                <select name="mode" defaultValue={test.mode}>
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
              <div className="question-grid">
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
              <label className="check-row">
                <input
                  name="shuffleQuestions"
                  type="checkbox"
                  defaultChecked={test.shuffleQuestions}
                />{" "}
                Shuffle questions
              </label>
              <label className="check-row">
                <input
                  name="shuffleOptions"
                  type="checkbox"
                  defaultChecked={test.shuffleOptions}
                />{" "}
                Shuffle options
              </label>
              <label className="field">
                <span>Instructions</span>
                <textarea
                  name="instructions"
                  defaultValue={test.instructions ?? ""}
                  rows={4}
                />
              </label>
              <button className="button secondary" type="submit">
                {busy === "settings" ? "Saving…" : "Save settings"}
              </button>
            </fieldset>
          </form>
        </details>
      )}
      <section className="test-paper-workspace">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PAPER STRUCTURE</span>
            <h2>Sections &amp; questions</h2><p>Open a section to edit its settings, write questions or import a spreadsheet.</p>
          </div>
        </div>
        {sections.length ? (
          <div className="taxonomy-list">
            {sections.map((section, sectionIndex) => (
              <article className="taxonomy-card test-section-card" key={section.id}>
                <header className="test-section-heading"><div><span>SECTION {sectionIndex + 1}</span><h3>{section.title}</h3></div><strong>{section.questions.length} questions</strong></header>
                {editable && (
                  <details>
                    <summary>Edit section settings</summary>
                    <form
                      className="admin-form"
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
                      <fieldset disabled={Boolean(busy)}>
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
                        <button className="button secondary" type="submit">
                          Save section
                        </button>
                      </fieldset>
                    </form>
                  </details>
                )}
                {editable && section.questions.length === 0 && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={Boolean(busy)}
                    onClick={() => remove(`sections/${section.id}`)}
                  >
                    Remove empty section
                  </button>
                )}
                <p className="muted section-summary">{section.durationMinutes ? `${section.durationMinutes} minutes · ` : ""}{section.questions.length ? "Questions are shown in the student exam order below." : "Add the first question manually or import Excel / CSV."}</p>
                {section.questions.map((question, index) => (
                  <div className="assigned-question" key={question.questionId}>
                    <span>{question.sortOrder + 1}</span>
                    <div>
                      <p>{question.stem}</p>
                      <details>
                        <summary>Preview answer & explanation</summary>
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
                    <small>{question.type.replaceAll("_", " ")}</small>
                    {editable && (
                      <>
                        {canCreate && (
                          <Link
                            className="text-button"
                            href={`/admin/tests/${test.id}/questions/${question.questionId}`}
                          >
                            Edit in this test
                          </Link>
                        )}
                        <button
                          type="button"
                          className="text-button"
                          aria-label={`Move question ${index + 1} up`}
                          disabled={Boolean(busy) || index === 0}
                          onClick={() => move(section, index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="text-button"
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
                          className="text-button"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            remove(
                              `sections/${section.id}/questions/${question.questionId}`,
                            )
                          }
                        >
                          Remove question
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
                    className="topic-row topic-new"
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
                    <fieldset disabled={Boolean(busy)}>
                      <label className="field">
                        <span>
                          Reuse an existing question (optional)
                        </span>
                        <select name="questionId">
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
                      <button className="button" type="submit">
                        Assign
                      </button>
                    </fieldset>
                  </form>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="panel empty-state compact-empty">
            <h2>No sections yet</h2>
            <p>Add a section to start building the paper.</p>
          </div>
        )}
        {editable && (
          <form
            className="admin-card inline-admin-form add-section-card"
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
            <fieldset disabled={Boolean(busy)}>
              <Field
                id="new-section-title"
                label="New section"
                name="title"
                defaultValue={sections.length ? "" : "Questions"}
                required
              />
              <div className="question-grid">
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
              <button className="button secondary" type="submit">
                {busy === "section" ? "Adding…" : "Add section"}
              </button>
            </fieldset>
          </form>
        )}
      </section>
      {error && (
        <p className="notice danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
