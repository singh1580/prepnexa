"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/features/auth/ui/field";
import {
  parseQuestionCsv,
  testQuestionCsvTemplate,
} from "@/features/admin-imports/question-csv";

const optionKeys = ["A", "B", "C", "D"] as const;

export function AddTestQuestions({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "sheet">("manual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseQuestionCsv>>();

  async function post(path: string, body: Record<string, unknown>) {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok || result.error)
      throw new Error(result.error?.message ?? "Could not save questions.");
    return result.data;
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await post(`/api/admin/tests/sections/${sectionId}/new-question`, {
        type: "SINGLE_CHOICE",
        stem: String(data.get("stem")),
        imageUrl: String(data.get("imageUrl") ?? ""),
        explanation: String(data.get("explanation") ?? ""),
        marks: Number(data.get("marks")),
        negativeMarks: Number(data.get("negativeMarks")),
        difficulty: String(data.get("difficulty")),
        options: optionKeys.map((key, index) => ({
          stableKey: key,
          body: String(data.get(`option${key}`)),
          isCorrect: data.get("correctOption") === key,
          sortOrder: index,
        })),
        numericAnswer: null,
        numericTolerance: 0,
        acceptedAnswers: [],
        caseSensitive: false,
      });
      form.reset();
      setSuccess("Question added successfully.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add question.");
    } finally {
      setBusy(false);
    }
  }

  async function readSheet(file?: File) {
    if (!file) return;
    setError("");
    setPreview(undefined);
    if (file.size > 1_000_000) {
      setError("Choose a spreadsheet no larger than 1 MB.");
      return;
    }
    try {
      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("This workbook has no worksheet.");
        setCsv(XLSX.utils.sheet_to_csv(sheet));
      } else setCsv(await file.text());
    } catch (cause) {
      setCsv("");
      setError(cause instanceof Error ? cause.message : "Could not read this file.");
    }
  }

  async function submitSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = parseQuestionCsv(csv);
    setPreview(checked);
    if (checked.issues.length) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await post(`/api/admin/tests/sections/${sectionId}/import`, { csv });
      if (result.status === "INVALID") {
        setPreview({ questions: [], issues: result.issues, totalRows: result.totalRows });
        return;
      }
      setCsv("");
      setPreview(undefined);
      setSuccess(`${result.importedRows} questions imported successfully.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(
      new Blob([testQuestionCsvTemplate()], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "prepstore-test-questions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="question-workbench">
      <div className="section-heading">
        <div>
          <h3>Add questions</h3>
          <p>Write one MCQ or upload up to 500 questions together.</p>
        </div>
        <div className="segmented-actions" aria-label="Question input method">
          <button className={mode === "manual" ? "active" : ""} type="button" onClick={() => setMode("manual")}>Manual</button>
          <button className={mode === "sheet" ? "active" : ""} type="button" onClick={() => setMode("sheet")}>Excel / CSV</button>
        </div>
      </div>

      {mode === "manual" ? (
        <form className="admin-form" onSubmit={submitManual}>
          <fieldset disabled={busy}>
            <label className="field field-wide">
              <span>Question</span>
              <textarea name="stem" rows={4} minLength={3} required placeholder="Write the question here" />
            </label>
            <Field id={`image-${sectionId}`} label="Question image URL (optional)" name="imageUrl" type="url" placeholder="https://…" />
            <div className="option-editor">
              {optionKeys.map((key) => (
                <div className="option-row" key={key}>
                  <label className="correct-choice" title="Mark as correct">
                    <input type="radio" name="correctOption" value={key} required />
                    <span>{key}</span>
                  </label>
                  <Field id={`option-${sectionId}-${key}`} label={`Option ${key}`} name={`option${key}`} required minLength={1} />
                </div>
              ))}
            </div>
            <label className="field field-wide">
              <span>Solution / explanation</span>
              <textarea name="explanation" rows={4} maxLength={10000} placeholder="Explain why the selected answer is correct" />
            </label>
            <div className="admin-form-grid">
              <Field id={`marks-${sectionId}`} label="Marks" name="marks" type="number" min={0.01} step="0.01" defaultValue={1} required />
              <Field id={`negative-${sectionId}`} label="Negative marks" name="negativeMarks" type="number" min={0} step="0.01" defaultValue={0} required />
              <label className="field"><span>Difficulty</span><select name="difficulty" defaultValue="MEDIUM"><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></label>
            </div>
            <div className="form-actions"><button className="button" type="submit">{busy ? "Adding…" : "Add question"}</button></div>
          </fieldset>
        </form>
      ) : (
        <form className="admin-form" onSubmit={submitSheet}>
          <fieldset disabled={busy}>
            <div className="import-toolbar">
              <label className="button secondary file-button">Choose Excel / CSV<input type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={(event) => void readSheet(event.target.files?.[0])} /></label>
              <button className="button secondary" type="button" onClick={downloadTemplate}>Download template</button>
            </div>
            <label className="field field-wide"><span>Spreadsheet preview</span><textarea value={csv} rows={9} required onChange={(event) => { setCsv(event.target.value); setPreview(undefined); }} placeholder="Upload a file or paste CSV rows" /></label>
            {preview && !preview.issues.length && <p className="import-ready">{preview.questions.length} questions are ready to import.</p>}
            {preview?.issues.map((issue, index) => <p className="notice danger" key={`${issue.rowNumber}-${index}`}>Row {issue.rowNumber}: {issue.message}</p>)}
            <div className="form-actions"><button className="button" type="submit">{busy ? "Importing…" : "Check and import"}</button></div>
          </fieldset>
        </form>
      )}
      {error && <p className="notice danger" role="alert">{error}</p>}
      {success && <p className="notice success" role="status">{success}</p>}
    </section>
  );
}
