"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AddTestQuestions } from "./add-questions";
import { Field } from "@/features/auth/ui/field";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

type Exam = { id: string; name: string };
type TestDetails = { id: string; examId: string; title: string; mode: "PRACTICE" | "MOCK" | "LIVE"; durationMinutes: number; instructions: string | null; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean; status: string };
type Section = { id: string; title: string; durationMinutes: number | null; sortOrder: number; questions: { questionId: string; stem: string; type: string; sortOrder: number; explanation: string | null; marks: string; negativeMarks: string; options: { body: string; correct: boolean }[]; answerConfig: Record<string, unknown> }[] };
type Question = { id: string; stem: string; topicName: string; subjectName: string };

class RequestError extends Error {}
async function request<T>(path: string, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
  const response = await fetch(`/api/admin/tests/${path}`, { method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as ApiSuccess<T> | ApiFailure;
  if (!response.ok || "error" in payload) throw new RequestError("error" in payload ? payload.error.message : "Couldn't complete this request.");
  return payload.data;
}
function payload(data: FormData) { return { examId: String(data.get("examId")), title: String(data.get("title")), mode: "MOCK", durationMinutes: Number(data.get("durationMinutes")), instructions: String(data.get("instructions") ?? ""), maxAttempts: Number(data.get("maxAttempts")), shuffleQuestions: data.get("shuffleQuestions") === "on", shuffleOptions: data.get("shuffleOptions") === "on" }; }

export function TestCreateForm({ exams, selectedExamId }: { exams: Exam[]; selectedExamId?: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); try { const result = await request<{ id: string }>("", "POST", payload(new FormData(event.currentTarget))); router.push(`/admin/tests/${result.id}`); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't create the test."); setBusy(false); } }
  return <form className="admin-form" onSubmit={submit}><fieldset disabled={busy}><label className="field"><span>Exam</span><select name="examId" defaultValue={selectedExamId} required>{exams.map((exam) => <option value={exam.id} key={exam.id}>{exam.name}</option>)}</select></label><Field id="new-test-title" label="Test title" name="title" required minLength={3} maxLength={200} placeholder="Full-length mock test 01" /><div className="question-grid"><input type="hidden" name="mode" value="MOCK" /><Field id="new-test-duration" label="Duration (minutes)" name="durationMinutes" type="number" min={1} max={600} defaultValue={60} required /></div><Field id="new-test-attempts" label="Maximum attempts" name="maxAttempts" type="number" min={1} max={100} defaultValue={1} required /><label className="check-row"><input name="shuffleQuestions" type="checkbox" defaultChecked /> Shuffle questions</label><label className="check-row"><input name="shuffleOptions" type="checkbox" defaultChecked /> Shuffle options</label><label className="field"><span>Instructions</span><textarea name="instructions" maxLength={10000} rows={4} /></label><button className="button" type="submit">{busy ? "Creating…" : "Create draft test"}</button></fieldset>{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

export function TestBuilder({ test, exams, sections, questions, canManage, canCreate, canPublish, topics }: { test: TestDetails; exams: Exam[]; sections: Section[]; questions: Question[]; canManage: boolean; canCreate: boolean; canPublish: boolean; topics: { id: string; topicName: string; subjectName: string; examName: string }[] }) {
  const router = useRouter(); const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const draft = test.status === "DRAFT" && test.mode === "MOCK" && canManage;
  async function mutate(event: FormEvent<HTMLFormElement>, path: string, method: "POST" | "PATCH" | "DELETE", bodyBuilder: (data: FormData) => Record<string, unknown>, key: string) { event.preventDefault(); const form = event.currentTarget; setBusy(key); setError(""); try { await request(path, method, bodyBuilder(new FormData(form))); if (method === "POST") form.reset(); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't save this change."); } finally { setBusy(""); } }
  async function publish() { setBusy("publish"); setError(""); try { await request(`${test.id}/publish`, "POST", {}); router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't publish the test."); } finally { setBusy(""); } }
  async function remove(path: string) {
    setBusy("remove"); setError("");
    try { await request(path, "DELETE", {}); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't remove this item."); }
    finally { setBusy(""); }
  }
  async function transition(action: "archive" | "duplicate") {
    setBusy(action); setError("");
    try {
      const result = await request<{ id: string }>(`${test.id}/${action}`, "POST", {});
      if (action === "duplicate") router.push(`/admin/tests/${result.id}`);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't update the test."); }
    finally { setBusy(""); }
  }
  async function move(section: Section, index: number, offset: number) {
    const questionIds = section.questions.map(question => question.questionId);
    [questionIds[index], questionIds[index + offset]] = [questionIds[index + offset], questionIds[index]];
    setBusy("order"); setError("");
    try { await request(`sections/${section.id}/order`, "PATCH", { questionIds }); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't reorder questions."); }
    finally { setBusy(""); }
  }
  return <div className="test-builder">
    {canManage && test.mode === "MOCK" && <div className="form-actions">
      <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => transition("duplicate")}>Duplicate test</button>
      {test.status !== "ARCHIVED" && <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => transition("archive")}>Archive test</button>}
    </div>}
    {draft && <details className="panel"><summary>Test settings — duration, instructions and attempts</summary><span className="eyebrow">CONFIGURATION</span><h2>Test settings</h2><form className="admin-form" onSubmit={(event) => mutate(event, test.id, "PATCH", payload, "settings")}><fieldset disabled={Boolean(busy)}><label className="field"><span>Exam</span><select name="examId" defaultValue={test.examId}>{exams.map((exam) => <option value={exam.id} key={exam.id}>{exam.name}</option>)}</select></label><Field id="edit-test-title" label="Title" name="title" defaultValue={test.title} required /><div className="question-grid"><input type="hidden" name="mode" value="MOCK" /><Field id="edit-test-duration" label="Duration" name="durationMinutes" type="number" min={1} max={600} defaultValue={test.durationMinutes} required /></div><Field id="edit-test-attempts" label="Maximum attempts" name="maxAttempts" type="number" min={1} max={100} defaultValue={test.maxAttempts} required /><label className="check-row"><input name="shuffleQuestions" type="checkbox" defaultChecked={test.shuffleQuestions} /> Shuffle questions</label><label className="check-row"><input name="shuffleOptions" type="checkbox" defaultChecked={test.shuffleOptions} /> Shuffle options</label><label className="field"><span>Instructions</span><textarea name="instructions" defaultValue={test.instructions ?? ""} rows={4} /></label><button className="button secondary" type="submit">{busy === "settings" ? "Saving…" : "Save settings"}</button></fieldset></form></details>}
    <section><div className="section-heading"><div><span className="eyebrow">PAPER STRUCTURE</span><h2>Sections and questions</h2></div>{draft && canPublish && <button type="button" className="button" disabled={Boolean(busy)} onClick={publish}>{busy === "publish" ? "Publishing…" : "Publish test and its questions"}</button>}</div>{sections.length ? <div className="taxonomy-list">{sections.map((section) => <article className="taxonomy-card" key={section.id}><h3>{section.title}</h3>{draft && <details><summary>Edit section settings</summary><form className="admin-form" onSubmit={(event) => mutate(event, `sections/${section.id}`, "PATCH", (data) => ({ title: String(data.get("title")), durationMinutes: data.get("durationMinutes") ? Number(data.get("durationMinutes")) : null, sortOrder: Number(data.get("sortOrder")) }), `edit-${section.id}`)}><fieldset disabled={Boolean(busy)}>
      <Field id={`section-title-${section.id}`} label="Section title" name="title" defaultValue={section.title} required />
      <Field id={`section-minutes-${section.id}`} label="Section minutes (optional)" name="durationMinutes" type="number" min={1} max={600} defaultValue={section.durationMinutes ?? ""} />
      <Field id={`section-order-${section.id}`} label="Section order" name="sortOrder" type="number" min={0} defaultValue={section.sortOrder} required />
      <button className="button secondary" type="submit">Save section</button>
    </fieldset></form></details>}{draft && section.questions.length === 0 && <button type="button" className="text-button" disabled={Boolean(busy)} onClick={() => remove(`sections/${section.id}`)}>Remove empty section</button>}<p className="muted">{section.questions.length} questions · order {section.sortOrder}</p>{section.questions.map((question, index) => <div className="assigned-question" key={question.questionId}><span>{question.sortOrder + 1}</span><div><p>{question.stem}</p><details><summary>Preview answer & explanation</summary><p>Marks: {question.marks} · Negative marks: {question.negativeMarks}</p>{question.options.length > 0 && <ol type="A">{question.options.map((option, index) => <li key={index}>{option.body}{option.correct ? " — Correct answer" : ""}</li>)}</ol>}{question.type === "NUMERIC" && <p>Answer: {String(question.answerConfig?.value ?? "")} · Tolerance: {String(question.answerConfig?.tolerance ?? 0)}</p>}{question.type === "TEXT" && <p>Accepted answers: {Array.isArray(question.answerConfig?.acceptedAnswers) ? question.answerConfig.acceptedAnswers.join(", ") : ""}</p>}<p>{question.explanation || "No explanation added."}</p></details></div><small>{question.type.replaceAll("_", " ")}</small>{draft && <>{canCreate && <Link className="text-button" href={`/admin/tests/${test.id}/questions/${question.questionId}`}>Edit in this test</Link>}<button type="button" className="text-button" aria-label={`Move question ${index + 1} up`} disabled={Boolean(busy) || index === 0} onClick={() => move(section, index, -1)}>↑</button><button type="button" className="text-button" aria-label={`Move question ${index + 1} down`} disabled={Boolean(busy) || index === section.questions.length - 1} onClick={() => move(section, index, 1)}>↓</button><button type="button" className="text-button" disabled={Boolean(busy)} onClick={() => remove(`sections/${section.id}/questions/${question.questionId}`)}>Remove question</button></>}</div>)}{draft && canCreate && <AddTestQuestions sectionId={section.id} examId={test.examId} topics={topics} />}{draft && questions.length > 0 && <form className="topic-row topic-new" onSubmit={(event) => mutate(event, `sections/${section.id}/questions`, "POST", (data) => ({ questionId: String(data.get("questionId")), sortOrder: Number(data.get("sortOrder")) }), `assign-${section.id}`)}><fieldset disabled={Boolean(busy)}><label className="field"><span>Reuse a question from the question bank (optional)</span><select name="questionId">{questions.map((question) => <option value={question.id} key={question.id}>{question.subjectName} · {question.topicName} · {question.stem.slice(0, 70)}</option>)}</select></label><Field id={`assign-order-${section.id}`} label="Order" name="sortOrder" type="number" min={0} defaultValue={section.questions.reduce((next, question) => Math.max(next, question.sortOrder + 1), 0)} required /><button className="button" type="submit">Assign</button></fieldset></form>}</article>)}</div> : <div className="panel empty-state compact-empty"><h2>No sections yet</h2><p>Add a section to start building the paper.</p></div>}
      {draft && <form className="panel inline-admin-form" onSubmit={(event) => mutate(event, `${test.id}/sections`, "POST", (data) => ({ title: String(data.get("title")), durationMinutes: data.get("durationMinutes") ? Number(data.get("durationMinutes")) : null, sortOrder: Number(data.get("sortOrder")) }), "section")}><fieldset disabled={Boolean(busy)}><Field id="new-section-title" label="New section" name="title" defaultValue={sections.length ? "" : "Questions"} required /><div className="question-grid"><Field id="new-section-duration" label="Section minutes (optional)" name="durationMinutes" type="number" min={1} max={600} /><Field id="new-section-order" label="Order" name="sortOrder" type="number" min={0} defaultValue={sections.reduce((next, section) => Math.max(next, section.sortOrder + 1), 0)} required /></div><button className="button secondary" type="submit">{busy === "section" ? "Adding…" : "Add section"}</button></fieldset></form>}</section>
    {error && <p className="notice danger" role="alert">{error}</p>}
  </div>;
}
