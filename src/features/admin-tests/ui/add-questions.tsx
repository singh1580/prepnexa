"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/features/auth/ui/field";
import {
  parseQuestionCsv,
  testQuestionCsvTemplate,
} from "@/features/admin-imports/question-csv";
import { csvCell } from "@/lib/csv";
import {
  adminControl,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

const testField = "grid gap-[0.38rem] text-[0.76rem] font-bold text-[#596168]";
const testTextarea =
  "w-full resize-y rounded-[0.45rem] border border-[#cacac5] bg-white p-3 font-normal outline-none focus:border-prep-orange focus:ring-2 focus:ring-[#ffdfd2]";
const errorNotice =
  "rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]";

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
      setError(
        cause instanceof Error ? cause.message : "Could not add question.",
      );
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
      if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import("read-excel-file/browser");
        const rows = await readSheet(file);
        if (!rows.length)
          throw new Error("This workbook has no worksheet data.");
        setCsv(rows.map((row) => row.map(csvCell).join(",")).join("\n"));
      } else if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
        setCsv(await file.text());
      } else {
        throw new Error("Choose a CSV or modern .xlsx workbook.");
      }
    } catch (cause) {
      setCsv("");
      setError(
        cause instanceof Error ? cause.message : "Could not read this file.",
      );
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
      const result = await post(
        `/api/admin/tests/sections/${sectionId}/import`,
        { csv },
      );
      if (result.status === "INVALID") {
        setPreview({
          questions: [],
          issues: result.issues,
          totalRows: result.totalRows,
        });
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
    <section className="mt-4 rounded-[0.7rem] border border-prep-line bg-white p-[1.15rem]">
      <div className="mb-4 flex items-start justify-between gap-4 max-[650px]:flex-col">
        <div>
          <h3>Add questions</h3>
          <p className="mt-1 text-sm text-prep-muted">
            Write one MCQ or upload up to 500 questions together.
          </p>
        </div>
        <div
          className="flex rounded-[0.55rem] bg-[#f2f4f7] p-[0.2rem]"
          aria-label="Question input method"
        >
          <button
            className={`rounded-[0.4rem] border-0 px-3 py-2 font-bold ${mode === "manual" ? "bg-white text-prep-orange-dark shadow-sm" : "bg-transparent text-prep-muted"}`}
            type="button"
            onClick={() => setMode("manual")}
          >
            Manual
          </button>
          <button
            className={`rounded-[0.4rem] border-0 px-3 py-2 font-bold ${mode === "sheet" ? "bg-white text-prep-orange-dark shadow-sm" : "bg-transparent text-prep-muted"}`}
            type="button"
            onClick={() => setMode("sheet")}
          >
            Excel / CSV
          </button>
        </div>
      </div>

      {mode === "manual" ? (
        <form onSubmit={submitManual}>
          <fieldset className="grid gap-4 border-0 p-0" disabled={busy}>
            <label className={testField}>
              <span>Question</span>
              <textarea
                className={testTextarea}
                name="stem"
                rows={4}
                minLength={3}
                required
                placeholder="Write the question here"
              />
            </label>
            <Field
              id={`image-${sectionId}`}
              label="Question image URL (optional)"
              name="imageUrl"
              type="url"
              placeholder="https://…"
            />
            <div className="grid gap-[0.6rem]">
              {optionKeys.map((key) => (
                <div
                  className="grid grid-cols-[3rem_minmax(0,1fr)] items-end gap-[0.65rem]"
                  key={key}
                >
                  <label
                    className="grid size-12 cursor-pointer place-items-center"
                    title="Mark as correct"
                  >
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="correctOption"
                      value={key}
                      required
                    />
                    <span className="grid size-9 place-items-center rounded-full border border-[#d0d5dd] font-extrabold peer-checked:border-prep-orange peer-checked:bg-prep-orange peer-checked:text-white">
                      {key}
                    </span>
                  </label>
                  <Field
                    id={`option-${sectionId}-${key}`}
                    label={`Option ${key}`}
                    name={`option${key}`}
                    required
                    minLength={1}
                  />
                </div>
              ))}
            </div>
            <label className={testField}>
              <span>Solution / explanation</span>
              <textarea
                className={testTextarea}
                name="explanation"
                rows={4}
                maxLength={10000}
                placeholder="Explain why the selected answer is correct"
              />
            </label>
            <div className="grid grid-cols-3 gap-[0.8rem] max-[650px]:grid-cols-1">
              <Field
                id={`marks-${sectionId}`}
                label="Marks"
                name="marks"
                type="number"
                min={0.01}
                step="0.01"
                defaultValue={1}
                required
              />
              <Field
                id={`negative-${sectionId}`}
                label="Negative marks"
                name="negativeMarks"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
                required
              />
              <label className={testField}>
                <span>Difficulty</span>
                <select
                  className={adminControl}
                  name="difficulty"
                  defaultValue="MEDIUM"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end">
              <button className={adminPrimaryButton} type="submit">
                {busy ? "Adding…" : "Add question"}
              </button>
            </div>
          </fieldset>
        </form>
      ) : (
        <form onSubmit={submitSheet}>
          <fieldset className="grid gap-4 border-0 p-0" disabled={busy}>
            <div className="flex flex-wrap gap-[0.65rem]">
              <label
                className={`${adminSecondaryButton} relative cursor-pointer overflow-hidden`}
              >
                Choose Excel / CSV
                <input
                  className="absolute inset-0 cursor-pointer opacity-0"
                  type="file"
                  accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => void readSheet(event.target.files?.[0])}
                />
              </label>
              <button
                className={adminSecondaryButton}
                type="button"
                onClick={downloadTemplate}
              >
                Download template
              </button>
            </div>
            <label className={testField}>
              <span>Spreadsheet preview</span>
              <textarea
                className={testTextarea}
                value={csv}
                rows={9}
                required
                onChange={(event) => {
                  setCsv(event.target.value);
                  setPreview(undefined);
                }}
                placeholder="Upload a file or paste CSV rows"
              />
            </label>
            {preview && !preview.issues.length && (
              <p className="rounded-prep-control bg-[#ecfdf3] p-3 text-sm font-bold text-[#027a48]">
                {preview.questions.length} questions are ready to import.
              </p>
            )}
            {preview?.issues.map((issue, index) => (
              <p className={errorNotice} key={`${issue.rowNumber}-${index}`}>
                Row {issue.rowNumber}: {issue.message}
              </p>
            ))}
            <div className="flex justify-end">
              <button className={adminPrimaryButton} type="submit">
                {busy ? "Importing…" : "Check and import"}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {error && (
        <p className={`${errorNotice} mt-4`} role="alert">
          {error}
        </p>
      )}
      {success && (
        <p
          className="mt-4 rounded-prep-control border border-[#bfe2cc] bg-[#e7f4ec] p-3 text-sm text-[#276448]"
          role="status"
        >
          {success}
        </p>
      )}
    </section>
  );
}
