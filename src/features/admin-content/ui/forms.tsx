"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/features/auth/ui/field";
import { adminContentRequest, AdminContentApiError } from "./api";

type Topic = { id: string; name: string; sortOrder: number };
type Subject = { id: string; name: string; sortOrder: number; topics: Topic[] };
type Exam = { id: string; name: string; slug: string; description: string | null };

function message(error: unknown) {
  return error instanceof AdminContentApiError ? error.message : "Couldn't save these changes. Please try again.";
}

export function ExamCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const result = await adminContentRequest<{ id: string }>("exams", "POST", data);
      router.push(`/admin/exams/${result.id}`); router.refresh();
    } catch (cause) { setError(message(cause)); setBusy(false); }
  }
  return <form className="admin-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Exam name" name="name" required minLength={2} maxLength={180} placeholder="TCS placement preparation" /><Field label="URL slug" name="slug" required minLength={2} maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" hint="Lowercase words separated with hyphens." placeholder="tcs-placement" /><label className="field">Description<textarea name="description" maxLength={4000} rows={4} placeholder="A concise public description." /></label><button className="button" type="submit">{busy ? "Creating…" : "Create draft exam"}</button></fieldset>{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

export function ExamEditForm({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try { await adminContentRequest(`exams/${exam.id}`, "PATCH", Object.fromEntries(new FormData(event.currentTarget))); setSuccess("Exam details saved."); router.refresh(); }
    catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  return <form className="admin-form" onSubmit={submit}><fieldset disabled={busy}><Field id="exam-name" label="Exam name" name="name" defaultValue={exam.name} required minLength={2} maxLength={180} /><Field id="exam-slug" label="URL slug" name="slug" defaultValue={exam.slug} required minLength={2} maxLength={160} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /><label className="field">Description<textarea name="description" defaultValue={exam.description ?? ""} maxLength={4000} rows={4} /></label><button className="button" type="submit">{busy ? "Saving…" : "Save exam"}</button></fieldset>{success && <p className="notice success" role="status">{success}</p>}{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

export function SubjectCreateForm({ examId, nextOrder }: { examId: string; nextOrder: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { await adminContentRequest(`exams/${examId}/subjects`, "POST", Object.fromEntries(new FormData(event.currentTarget))); event.currentTarget.reset(); router.refresh(); }
    catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  }
  return <form className="inline-admin-form" onSubmit={submit}><fieldset disabled={busy}><Field id="new-subject-name" label="Subject name" name="name" required minLength={2} maxLength={160} placeholder="Quantitative aptitude" /><Field id="new-subject-order" label="Display order" name="sortOrder" type="number" min={0} max={10000} defaultValue={nextOrder} required /><button className="button" type="submit">{busy ? "Adding…" : "Add subject"}</button></fieldset>{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}

export function SubjectEditor({ subject }: { subject: Subject }) {
  const router = useRouter();
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function mutate(event: FormEvent<HTMLFormElement>, path: string, method: "POST" | "PATCH", key: string) {
    event.preventDefault(); setBusy(key); setError(""); setSuccess("");
    try { await adminContentRequest(path, method, Object.fromEntries(new FormData(event.currentTarget))); if (method === "POST") event.currentTarget.reset(); setSuccess(method === "POST" ? "Topic added." : "Changes saved."); router.refresh(); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }
  return <article className="taxonomy-card">
    <form className="compact-form" onSubmit={(event) => mutate(event, `subjects/${subject.id}`, "PATCH", "subject")}><fieldset disabled={Boolean(busy)}><Field id={`subject-${subject.id}-name`} label="Subject name" name="name" defaultValue={subject.name} required minLength={2} maxLength={160} /><Field id={`subject-${subject.id}-order`} label="Order" name="sortOrder" type="number" min={0} max={10000} defaultValue={subject.sortOrder} required /><button className="button secondary" type="submit">{busy === "subject" ? "Saving…" : "Save subject"}</button></fieldset></form>
    <div className="topic-list"><div className="taxonomy-label">TOPICS</div>{subject.topics.length ? subject.topics.map((topic) => <form className="topic-row" key={topic.id} onSubmit={(event) => mutate(event, `topics/${topic.id}`, "PATCH", topic.id)}><fieldset disabled={Boolean(busy)}><Field id={`topic-${topic.id}-name`} label="Topic name" name="name" defaultValue={topic.name} required minLength={2} maxLength={160} /><Field id={`topic-${topic.id}-order`} label="Order" name="sortOrder" type="number" min={0} max={10000} defaultValue={topic.sortOrder} required /><button className="button secondary" type="submit">{busy === topic.id ? "Saving…" : "Save"}</button></fieldset></form>) : <p className="muted">No topics have been added.</p>}</div>
    <form className="topic-row topic-new" onSubmit={(event) => mutate(event, `subjects/${subject.id}/topics`, "POST", "new-topic")}><fieldset disabled={Boolean(busy)}><Field id={`subject-${subject.id}-new-topic`} label="New topic" name="name" required minLength={2} maxLength={160} placeholder="Percentages" /><Field id={`subject-${subject.id}-new-order`} label="Order" name="sortOrder" type="number" min={0} max={10000} defaultValue={subject.topics.length} required /><button className="button" type="submit">{busy === "new-topic" ? "Adding…" : "Add topic"}</button></fieldset></form>
    {success && <p className="notice success" role="status">{success}</p>}{error && <p className="notice danger" role="alert">{error}</p>}
  </article>;
}
