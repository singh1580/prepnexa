"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { QuestionForm } from "@/features/admin-content/ui/question-forms";
import { parseQuestionCsv, testQuestionCsvTemplate } from "@/features/admin-imports/question-csv";

type Topic = { id: string; topicName: string; subjectName: string; examName: string };
export function AddTestQuestions({ sectionId, examId, topics }: { sectionId: string; examId: string; topics: Topic[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "csv" | null>(null);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseQuestionCsv> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function download() {
    const url = URL.createObjectURL(new Blob([testQuestionCsvTemplate()], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "test-questions.csv"; link.click(); URL.revokeObjectURL(url);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!preview || preview.issues.length) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/admin/tests/sections/${sectionId}/import`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv, topicId }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error?.message ?? "Could not import these questions.");
      if (payload.data.status === "INVALID") { setPreview({ questions: [], issues: payload.data.issues, totalRows: payload.data.totalRows }); return; }
      setSuccess(`${payload.data.importedRows} questions added to this section in CSV order. Review the paper, then publish the test.`);
      setCsv(""); setPreview(null); setMode(null); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed."); }
    finally { setBusy(false); }
  }
  if (!topics.length) return <p className="notice">Add a subject and topic in <Link href={`/admin/exams/${examId}`}>this exam’s curriculum</Link> before adding questions.</p>;
  return <div className="panel">
    <h3>Add questions here</h3><p>Choose a topic, then write a question or import a complete set. Everything stays attached to this section.</p>
    <div className="form-actions">
      <button type="button" className="button secondary" disabled={busy} aria-pressed={mode === "manual"} onClick={() => { setMode(mode === "manual" ? null : "manual"); setSuccess(""); }}>Write a question</button>
      <button type="button" className="button secondary" disabled={busy} aria-pressed={mode === "csv"} onClick={() => { setMode(mode === "csv" ? null : "csv"); setSuccess(""); }}>Import question set</button>
    </div>
    {mode === "manual" && <QuestionForm sectionId={sectionId} topics={topics} onCancel={() => setMode(null)} onAdded={() => { setMode(null); setSuccess("Question added to this section."); }} />}
    {mode === "csv" && <form className="admin-form" onSubmit={submit}><fieldset disabled={busy}>
      <label className="field"><span>Subject / topic for this set</span><select value={topicId} onChange={event => { setTopicId(event.target.value); setPreview(null); }}>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.subjectName} / {topic.topicName}</option>)}</select></label>
      <p className="muted">All rows use the selected topic. Import another file for a different topic. No topic ID is needed in your spreadsheet.</p>
      <button className="button secondary" type="button" onClick={download}>Download CSV template</button>
      <label className="field"><span>CSV file (up to 500 questions, 1 MB)</span><input type="file" accept=".csv,text/csv" onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return; setPreview(null); setError("");
        if (file.size > 1_000_000) { setCsv(""); setError("Choose a CSV no larger than 1 MB."); return; }
        try { setCsv(await file.text()); } catch { setError("Could not read this file."); }
      }} /></label>
      <label className="field"><span>Paste or review CSV</span><textarea value={csv} rows={8} required onChange={event => { setCsv(event.target.value); setPreview(null); }} /></label>
      <p className="muted">For a normal MCQ, fill the question, choices and correctOptions (A, B, C or D). The template uses 1 mark, no negative marking and medium difficulty.</p>
      <details><summary>Other question types and marking</summary><p>Add optional columns: type (MULTIPLE_CHOICE, NUMERIC or TEXT), marks, negativeMarks, difficulty. Multiple-choice answers use A|C. Numeric questions use numericAnswer and numericTolerance; text questions use acceptedAnswers separated by | and caseSensitive.</p></details><button type="button" className="button secondary" onClick={() => { setError(""); setPreview(parseQuestionCsv(csv, topicId)); }}>Check and preview</button>
      {preview && (preview.issues.length ? <div className="notice danger" role="alert"><strong>No questions saved. Fix these rows:</strong><ul>{preview.issues.slice(0, 30).map((issue, index) => <li key={index}>Row {issue.rowNumber} · {issue.field}: {issue.message}</li>)}</ul>{preview.issues.length > 30 && <p>{preview.issues.length - 30} more errors.</p>}</div> : <div><p className="notice success">{preview.totalRows} valid questions. Ready to add to this section.</p><ol>{preview.questions.slice(0, 10).map((question, index) => <li key={index}>{question.stem}</li>)}</ol>{preview.totalRows > 10 && <p>Showing the first 10 questions.</p>}<button className="button" type="submit">{busy ? "Adding…" : `Add ${preview.totalRows} questions to this test`}</button></div>)}
    </fieldset></form>}
    {success && <p className="notice success" role="status">{success}</p>}
    {error && <p className="notice danger" role="alert">{error}</p>}
  </div>;
}
