"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/features/auth/ui/field";
import { adminContentRequest, AdminContentApiError } from "./api";

type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT";
type Option = { stableKey: string; body: string; isCorrect: boolean; sortOrder: number };
type TopicOption = { id: string; topicName: string; subjectName: string; examName: string };
type EditableQuestion = {
  id: string; topicId: string; type: QuestionType; stem: string; explanation: string | null;
  marks: string; negativeMarks: string; difficulty: string; options: Option[];
  answerConfig: Record<string, unknown>;
};

function errorMessage(error: unknown) {
  return error instanceof AdminContentApiError ? error.message : "Couldn't save this question. Please try again.";
}

const blankOptions = () => ["A", "B", "C", "D"].map((stableKey, sortOrder) => ({ stableKey, body: "", isCorrect: false, sortOrder }));

export function QuestionForm({ topics, question }: { topics: TopicOption[]; question?: EditableQuestion }) {
  const router = useRouter();
  const [type, setType] = useState<QuestionType>(question?.type ?? "SINGLE_CHOICE");
  const [options, setOptions] = useState<Option[]>(question?.options.length ? question.options : blankOptions());
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const answer = question?.answerConfig ?? {};

  function changeOption(index: number, patch: Partial<Option>) {
    setOptions((current) => current.map((option, position) => {
      if (position !== index) return patch.isCorrect && type === "SINGLE_CHOICE" ? { ...option, isCorrect: false } : option;
      return { ...option, ...patch };
    }));
  }
  function addOption() {
    setOptions((current) => [...current, { stableKey: String.fromCharCode(65 + current.length), body: "", isCorrect: false, sortOrder: current.length }]);
  }
  function removeOption(index: number) {
    setOptions((current) => current.filter((_, position) => position !== index).map((option, sortOrder) => ({ ...option, stableKey: String.fromCharCode(65 + sortOrder), sortOrder })));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const choice = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
    const numericRaw = String(data.get("numericAnswer") ?? "").trim();
    const payload = {
      topicId: String(data.get("topicId")), type, stem: String(data.get("stem")), explanation: String(data.get("explanation") ?? ""),
      marks: Number(data.get("marks")), negativeMarks: Number(data.get("negativeMarks")), difficulty: String(data.get("difficulty")),
      options: choice ? options.map((option) => ({ ...option, body: option.body.trim() })) : [],
      numericAnswer: type === "NUMERIC" && numericRaw ? Number(numericRaw) : null,
      numericTolerance: type === "NUMERIC" ? Number(data.get("numericTolerance") ?? 0) : 0,
      acceptedAnswers: type === "TEXT" ? String(data.get("acceptedAnswers") ?? "").split(/\n|,/).map((value) => value.trim()).filter(Boolean) : [],
      caseSensitive: type === "TEXT" && data.get("caseSensitive") === "on",
    };
    try {
      const result = await adminContentRequest<{ id: string }>(question ? `questions/${question.id}` : "questions", question ? "PATCH" : "POST", payload);
      router.push(`/admin/questions/${result.id}`); router.refresh();
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }

  const numericValue = typeof answer.value === "number" ? answer.value : "";
  const tolerance = typeof answer.tolerance === "number" ? answer.tolerance : 0;
  const accepted = Array.isArray(answer.acceptedAnswers) ? answer.acceptedAnswers.join("\n") : "";
  return <form className="question-form panel" onSubmit={submit}>
    <fieldset disabled={busy}>
      <div className="question-grid"><label className="field"><span>Topic</span><select name="topicId" defaultValue={question?.topicId} required>{topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.examName} · {topic.subjectName} · {topic.topicName}</option>)}</select></label><label className="field"><span>Question type</span><select value={type} onChange={(event) => { setType(event.target.value as QuestionType); setOptions((current) => current.map((option) => ({ ...option, isCorrect: false }))); }}><option value="SINGLE_CHOICE">Single choice</option><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="NUMERIC">Numeric answer</option><option value="TEXT">Text answer</option></select></label></div>
      <label className="field"><span>Question</span><textarea name="stem" defaultValue={question?.stem} required minLength={10} maxLength={20000} rows={6} placeholder="Write a complete, unambiguous question." /></label>
      <div className="question-grid three"><Field id="question-marks" label="Marks" name="marks" type="number" min={0.01} step="0.01" max={1000} defaultValue={question?.marks ?? "1"} required /><Field id="question-negative" label="Negative marks" name="negativeMarks" type="number" min={0} step="0.01" max={1000} defaultValue={question?.negativeMarks ?? "0"} required /><label className="field"><span>Difficulty</span><select name="difficulty" defaultValue={question?.difficulty ?? "MEDIUM"}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label></div>
      {(type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") && <section className="answer-builder"><div className="section-heading"><div><span className="eyebrow">ANSWER OPTIONS</span><h2>Mark the correct answer</h2></div>{options.length < 8 && <button className="button secondary" type="button" onClick={addOption}>Add option</button>}</div>{options.map((option, index) => <div className="option-editor" key={option.stableKey}><label className="correct-control"><input type={type === "SINGLE_CHOICE" ? "radio" : "checkbox"} name="correct-option" checked={option.isCorrect} onChange={(event) => changeOption(index, { isCorrect: event.target.checked })} /><span>{option.stableKey}</span></label><label className="field"><span>Option {option.stableKey}</span><input value={option.body} onChange={(event) => changeOption(index, { body: event.target.value })} required maxLength={4000} /></label>{options.length > 2 && <button className="text-button danger-text" type="button" onClick={() => removeOption(index)}>Remove</button>}</div>)}</section>}
      {type === "NUMERIC" && <div className="question-grid"><Field id="numeric-answer" label="Accepted answer" name="numericAnswer" type="number" step="any" defaultValue={numericValue} required /><Field id="numeric-tolerance" label="Allowed tolerance (±)" name="numericTolerance" type="number" step="any" min={0} max={1000} defaultValue={tolerance} required /></div>}
      {type === "TEXT" && <><label className="field"><span>Accepted answers</span><textarea name="acceptedAnswers" defaultValue={accepted} required rows={4} placeholder="One accepted answer per line" /></label><label className="check-row"><input name="caseSensitive" type="checkbox" defaultChecked={answer.caseSensitive === true} /> Answers are case-sensitive</label></>}
      <label className="field"><span>Explanation</span><textarea name="explanation" defaultValue={question?.explanation ?? ""} maxLength={20000} rows={5} placeholder="Explain why the answer is correct." /></label>
      <div className="form-actions"><button className="button" type="submit">{busy ? "Saving…" : question ? "Save new revision" : "Create draft question"}</button><button className="button secondary" type="button" onClick={() => router.push(question ? `/admin/questions/${question.id}` : "/admin/questions")}>Cancel</button></div>
    </fieldset>{error && <p className="notice danger" role="alert">{error}</p>}
  </form>;
}

export function QuestionWorkflowActions({ questionId, status, permissions }: { questionId: string; status: string; permissions: readonly string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canPublish = permissions.includes("question.publish");
  async function action(path: "publish" | "archive") {
    setBusy(true); setError("");
    try { await adminContentRequest(`questions/${questionId}/${path}`, "POST", {}); router.refresh(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  async function duplicate() {
    setBusy(true); setError("");
    try { const result = await adminContentRequest<{ id: string }>(`questions/${questionId}/duplicate`, "POST", {}); router.push(`/admin/questions/${result.id}`); router.refresh(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <section className="panel workflow-panel">
    <h2>Publication</h2>
    <p className="muted">Save any edits, check the question and answer, then publish.</p>
    <div className="workflow-actions">{status !== "DRAFT" && permissions.includes("question.create") && <button type="button" className="button secondary" disabled={busy} onClick={duplicate}>Create editable copy</button>}
      {(status === "DRAFT" || status === "IN_REVIEW") && canPublish && <button type="button" className="button" disabled={busy} onClick={() => action("publish")}>{busy ? "Publishing…" : "Publish question"}</button>}
      {status === "PUBLISHED" && canPublish && <button type="button" className="button secondary" disabled={busy} onClick={() => action("archive")}>{busy ? "Archiving…" : "Archive question"}</button>}
    </div>
    {status === "PUBLISHED" && <p className="notice success">This question is published.</p>}
    {status === "ARCHIVED" && <p className="notice">This question is archived and unavailable for new tests.</p>}
    {error && <p className="notice danger" role="alert">{error}</p>}
  </section>;
}
