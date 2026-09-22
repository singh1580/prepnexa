"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

type Answer = { selectedOptionIds: string[]; textAnswer: string | null; numericAnswer: string | null; markedForReview: boolean; version: number; savedAt: string | null };
type Question = { id: string; questionId: string; sectionId: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT"; position: number; stem: string; marks: string; negativeMarks: string; options: { id: string; body: string; position: number }[]; answer: Answer };
type Attempt = { id: string; status: string; title: string; examName: string; serverDeadlineAt: string | null; serverTime: string; remainingSeconds: number; sections: { id: string; title: string }[]; questions: Question[] };

function isAnswered(question: Question, answer: Answer) {
  if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") return answer.selectedOptionIds.length > 0;
  if (question.type === "NUMERIC") return Boolean(answer.numericAnswer);
  return Boolean(answer.textAnswer?.trim());
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const rest = safe % 60;
  return hours > 0 ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}` : `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}

export function TestRunner({ attempt }: { attempt: Attempt }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => Object.fromEntries(attempt.questions.map(question => [question.id, question.answer])));
  const answersRef = useRef(answers); const versions = useRef(new Map(attempt.questions.map(question => [question.id, question.answer.version])));
  const queues = useRef(new Map<string, Promise<void>>()); const dirtyAnswers = useRef(new Set<string>()); const submitRef = useRef<(automatic?: boolean) => Promise<void>>(async () => {});
  const [current, setCurrent] = useState(0); const [saving, setSaving] = useState(0); const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(attempt.status !== "IN_PROGRESS"); const [submitting, setSubmitting] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(attempt.remainingSeconds);
  const question = attempt.questions[current];
  const section = attempt.sections.find(item => item.id === question?.sectionId);
  const answeredCount = useMemo(() => attempt.questions.filter(item => isAnswered(item, answers[item.id])).length, [answers, attempt.questions]);

  function updateAnswer(snapshotId: string, patch: Partial<Answer>, persist = true) {
    const next = { ...answersRef.current[snapshotId], ...patch };
    answersRef.current = { ...answersRef.current, [snapshotId]: next }; setAnswers(answersRef.current);
    dirtyAnswers.current.add(snapshotId);
    if (persist) queueSave(snapshotId);
  }

  function queueSave(snapshotId: string) {
    const previous = queues.current.get(snapshotId) ?? Promise.resolve();
    const task = previous.catch(() => undefined).then(async () => {
      setSaving(value => value + 1); setError("");
      try {
        const answer = answersRef.current[snapshotId];
        const sent = JSON.stringify({ selectedOptionIds: answer.selectedOptionIds, textAnswer: answer.textAnswer, numericAnswer: answer.numericAnswer, markedForReview: answer.markedForReview });
        const response = await fetch(`/api/attempts/${attempt.id}/answers/${snapshotId}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answer, version: versions.current.get(snapshotId) ?? 0 }) });
        const payload = await response.json() as ApiSuccess<{ version: number; savedAt: string }> | ApiFailure;
        if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error.message : "Couldn't save this answer.");
        versions.current.set(snapshotId, payload.data.version);
        const currentAnswer = answersRef.current[snapshotId];
        answersRef.current = { ...answersRef.current, [snapshotId]: { ...currentAnswer, version: payload.data.version, savedAt: payload.data.savedAt } }; setAnswers(answersRef.current);
        const current = answersRef.current[snapshotId];
        if (JSON.stringify({ selectedOptionIds: current.selectedOptionIds, textAnswer: current.textAnswer, numericAnswer: current.numericAnswer, markedForReview: current.markedForReview }) === sent) dirtyAnswers.current.delete(snapshotId);
      } catch (reason) { const message = reason instanceof Error ? reason.message : "Couldn't save this answer."; setError(message); throw reason; }
      finally { setSaving(value => Math.max(0, value - 1)); }
    });
    queues.current.set(snapshotId, task); void task.catch(() => undefined);
  }

  async function performSubmit(automatic = false) {
    if (submitting || submitted) return;
    if (!automatic && !window.confirm(`Submit this test? ${attempt.questions.length - answeredCount} question(s) are unanswered.`)) return;
    setSubmitting(true); setError("");
    for (const snapshotId of dirtyAnswers.current) queueSave(snapshotId);
    const pending = await Promise.allSettled([...queues.current.values()]);
    if (!automatic && pending.some(item => item.status === "rejected")) { setError("One or more answers were not saved. Check your connection and try again."); setSubmitting(false); return; }
    try {
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: "POST", credentials: "same-origin" });
      const payload = await response.json() as ApiSuccess<{ status: string; resultId: string }> | ApiFailure;
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error.message : "Couldn't submit the test.");
      setResultId(payload.data.resultId); setSubmitted(true); setRemaining(0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Couldn't submit the test."); }
    finally { setSubmitting(false); }
  }
  useEffect(() => { submitRef.current = performSubmit; });

  useEffect(() => {
    if (submitted) return;
    const initial = attempt.remainingSeconds; const started = Date.now();
    const timer = window.setInterval(() => {
      const value = Math.max(0, initial - Math.floor((Date.now() - started) / 1000)); setRemaining(value);
      if (value === 0) { window.clearInterval(timer); void submitRef.current(true); }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt.remainingSeconds, submitted]);
  useEffect(() => {
    if (submitted) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [submitted]);

  if (submitted) return <section className="panel attempt-complete"><div className="large-icon" aria-hidden="true">✓</div><span className="eyebrow">ATTEMPT SUBMITTED</span><h1>Your result is ready</h1><p>Your score, topic analysis and answer explanations are available now.</p><Link className="button" href={resultId ? `/results/${resultId}` : "/dashboard/results"}>View result</Link></section>;
  if (!question) return <section className="panel empty-state"><h1>This paper has no questions</h1><Link className="button" href="/dashboard/tests">Back to my tests</Link></section>;
  const answer = answers[question.id];
  return <div className="attempt-runner">
    <header className="attempt-toolbar"><div><span className="eyebrow">{attempt.examName}</span><h1>{attempt.title}</h1></div><div className={`attempt-timer ${remaining < 300 ? "ending" : ""}`} aria-live="polite"><small>TIME LEFT</small><strong>{formatTime(remaining)}</strong></div></header>
    {error && <div className="notice danger" role="alert">{error}</div>}
    <div className="attempt-layout"><main className="panel attempt-question"><div className="question-topline"><span>{section?.title ?? "Questions"}</span><span>Question {current + 1} of {attempt.questions.length}</span></div><h2>{question.stem}</h2><p className="marks-note">{question.marks} mark{question.marks === "1" ? "" : "s"}{Number(question.negativeMarks) > 0 ? ` · −${question.negativeMarks} for an incorrect answer` : " · No negative marking"}</p>
      {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && <div className="attempt-options">{question.options.map((option, index) => { const checked = answer.selectedOptionIds.includes(option.id); return <label className={checked ? "attempt-option selected" : "attempt-option"} key={option.id}><input type={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"} name={`question-${question.id}`} checked={checked} onChange={() => { const selectedOptionIds = question.type === "SINGLE_CHOICE" ? [option.id] : checked ? answer.selectedOptionIds.filter(id => id !== option.id) : [...answer.selectedOptionIds, option.id]; updateAnswer(question.id, { selectedOptionIds }); }} /><strong>{String.fromCharCode(65 + index)}</strong><span>{option.body}</span></label>; })}</div>}
      {question.type === "NUMERIC" && <label className="field attempt-written"><span>Numeric answer</span><div className="input-wrap"><input inputMode="decimal" value={answer.numericAnswer ?? ""} onChange={event => updateAnswer(question.id, { numericAnswer: event.target.value }, false)} onBlur={() => queueSave(question.id)} /></div></label>}
      {question.type === "TEXT" && <label className="field attempt-written"><span>Written answer</span><textarea rows={7} maxLength={10_000} value={answer.textAnswer ?? ""} onChange={event => updateAnswer(question.id, { textAnswer: event.target.value }, false)} onBlur={() => queueSave(question.id)} /></label>}
      <div className="attempt-question-actions"><button className="text-button" type="button" onClick={() => updateAnswer(question.id, { selectedOptionIds: [], textAnswer: null, numericAnswer: null })}>Clear response</button><label className="review-control"><input type="checkbox" checked={answer.markedForReview} onChange={event => updateAnswer(question.id, { markedForReview: event.target.checked })} />Mark for review</label></div>
      <footer className="attempt-navigation"><button className="button secondary" disabled={current === 0} onClick={() => setCurrent(value => value - 1)}>← Previous</button><span aria-live="polite">{saving ? "Saving…" : answer.savedAt ? "Saved" : "Not answered"}</span>{current < attempt.questions.length - 1 ? <button className="button" onClick={() => setCurrent(value => value + 1)}>Save & next →</button> : <button className="button" onClick={() => void performSubmit()} disabled={submitting}>{submitting ? "Submitting…" : "Review & submit"}</button>}</footer>
    </main><aside className="panel attempt-palette"><div className="section-heading"><div><span className="eyebrow">QUESTION MAP</span><h2>{answeredCount}/{attempt.questions.length} answered</h2></div></div><div className="palette-grid">{attempt.questions.map((item, index) => { const itemAnswer = answers[item.id]; const classes = [index === current ? "current" : "", isAnswered(item, itemAnswer) ? "answered" : "", itemAnswer.markedForReview ? "review" : ""].filter(Boolean).join(" "); return <button className={classes} key={item.id} aria-label={`Question ${index + 1}`} aria-current={index === current ? "true" : undefined} onClick={() => setCurrent(index)}>{index + 1}</button>; })}</div><div className="palette-key"><span><i className="answered" />Answered</span><span><i className="review" />Review</span><span><i />Not answered</span></div><button className="button full" disabled={submitting} onClick={() => void performSubmit()}>{submitting ? "Submitting…" : "Submit test"}</button></aside></div>
  </div>;
}
