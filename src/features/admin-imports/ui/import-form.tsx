"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiFailure, ApiSuccess } from "@/lib/http/api-response";

type Issue = { rowNumber: number; field: string | null; code: string; message: string };
type Result = { id: string; status: "INVALID" | "IMPORTED"; totalRows: number; importedRows: number; issues: Issue[] };
export function QuestionImportForm({ template }: { template: string }) {
  const router = useRouter(); const [csv, setCsv] = useState(template); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<Result | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); setResult(null); try { const response = await fetch("/api/admin/imports/questions", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) }); const payload = await response.json() as ApiSuccess<Result> | ApiFailure; if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error.message : "Import failed."); setResult(payload.data); if (payload.data.status === "IMPORTED") router.refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed."); } finally { setBusy(false); } }
  return <form className="panel import-form" onSubmit={submit}><span className="eyebrow">CSV IMPORT</span><h2>Upload or paste CSV</h2><label className="field"><span>Choose CSV file</span><input type="file" accept=".csv,text/csv" disabled={busy} onChange={async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setError(""); setResult(null);
    if (file.size > 1000000) { setError("Choose a CSV smaller than 1 MB."); return; }
    try { setCsv(await file.text()); } catch { setError("Could not read this file."); }
  }} /></label><p className="muted">Maximum 500 rows and 1 MB. If any row fails validation, no question is imported.</p><label className="field"><span>Question CSV</span><textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={14} spellCheck={false} required /></label><button className="button" type="submit" disabled={busy}>{busy ? "Validating all rows…" : "Validate and import"}</button>{result?.status === "IMPORTED" && <p className="notice success" role="status">Imported {result.importedRows} draft question{result.importedRows === 1 ? "" : "s"}. Job {result.id.slice(0, 8)}.</p>}{result?.status === "INVALID" && <div className="notice danger" role="alert"><strong>No rows imported.</strong><ul>{result.issues.slice(0, 20).map((issue, index) => <li key={`${issue.rowNumber}-${issue.field}-${index}`}>Row {issue.rowNumber}{issue.field ? ` · ${issue.field}` : ""}: {issue.message}</li>)}</ul>{result.issues.length > 20 && <p>Plus {result.issues.length - 20} more errors.</p>}</div>}{error && <p className="notice danger" role="alert">{error}</p>}</form>;
}
