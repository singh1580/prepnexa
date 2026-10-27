"use client";

import { useMemo, useState } from "react";

export type ReviewQuestionView = {
  id: string;
  position: number;
  stem: string;
  explanation: string | null;
  type: string;
  selectedOptionIds: string[] | null;
  textAnswer: string | null;
  numericAnswer: string | null;
  isCorrect: boolean;
  sectionTitle: string;
  answerConfig: Record<string, unknown>;
  options: {
    id: string;
    body: string;
    isCorrect: boolean;
    selected: boolean;
  }[];
};
type Filter = "all" | "correct" | "incorrect" | "unanswered";

function isAnswered(question: ReviewQuestionView) {
  return Boolean(
    question.selectedOptionIds?.length ||
    question.textAnswer?.trim() ||
    question.numericAnswer != null,
  );
}
function status(question: ReviewQuestionView) {
  return question.isCorrect
    ? "correct"
    : isAnswered(question)
      ? "incorrect"
      : "unanswered";
}
function answerText(question: ReviewQuestionView, correct = false) {
  if (question.options.length) {
    const values = question.options
      .filter((option) => (correct ? option.isCorrect : option.selected))
      .map((option) => option.body);
    return values.join(", ") || "—";
  }
  if (question.type === "NUMERIC")
    return correct
      ? String(question.answerConfig.value ?? "—")
      : (question.numericAnswer ?? "—");
  const accepted = question.answerConfig.acceptedAnswers;
  return correct
    ? Array.isArray(accepted)
      ? accepted.join(", ")
      : "—"
    : question.textAnswer || "—";
}

function reviewStatusClass(state: ReturnType<typeof status>) {
  return state === "correct"
    ? "bg-[#e4f5ea] text-[#1b7a47]"
    : state === "incorrect"
      ? "bg-[#ffe7e5] text-[#d9342c]"
      : "bg-[#f0efed] text-[#686e73]";
}

export function ResultReviewTable({
  questions,
}: {
  questions: ReviewQuestionView[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const counts = useMemo(
    () =>
      questions.reduce(
        (value, question) => {
          value[status(question)]++;
          return value;
        },
        { correct: 0, incorrect: 0, unanswered: 0 },
      ),
    [questions],
  );
  const visible =
    filter === "all"
      ? questions
      : questions.filter((question) => status(question) === filter);
  const filters: [Filter, string, number][] = [
    ["all", "All", questions.length],
    ["correct", "Correct", counts.correct],
    ["incorrect", "Incorrect", counts.incorrect],
    ["unanswered", "Unanswered", counts.unanswered],
  ];
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[1rem]">Question review</h2>
      <nav
        className="mb-3 flex gap-[.6rem] overflow-x-auto pb-1 max-[500px]:grid max-[500px]:grid-cols-2"
        aria-label="Filter question review"
      >
        {filters.map(([key, label, count]) => (
          <button
            type="button"
            className={`min-w-[6.3rem] cursor-pointer rounded-[.38rem] border px-3 py-[.55rem] text-[.7rem] font-semibold max-[500px]:min-w-0 ${
              filter === key
                ? "border-prep-orange bg-prep-orange text-white"
                : "border-[#dadbdd] bg-white text-[#555c62] hover:border-prep-orange hover:text-prep-orange"
            }`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            key={key}
          >
            {label} ({count})
          </button>
        ))}
      </nav>
      <div className="overflow-x-auto border-t border-[#e4e2df] max-[700px]:overflow-visible">
        <table className="w-full border-collapse max-[700px]:block">
          <thead className="max-[700px]:hidden">
            <tr>
              {[
                ["Q. No.", "8%"],
                ["Section", "21%"],
                ["Your answer", "20%"],
                ["Correct answer", "20%"],
                ["Result", "17%"],
                ["Action", "14%"],
              ].map(([label, width]) => (
                <th
                  className="px-[.45rem] py-[.65rem] text-left text-[.65rem] font-semibold text-[#72787d]"
                  key={label}
                  style={{ width }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-[700px]:grid max-[700px]:gap-3 max-[700px]:pt-3">
            {visible.map((question) => {
              const state = status(question),
                expanded = open === question.id;
              return (
                <tr className="max-[700px]:block" key={question.id}>
                  <td
                    className="border-t border-[#e8e6e2] p-0 max-[700px]:block max-[700px]:overflow-hidden max-[700px]:rounded-[.5rem] max-[700px]:border max-[700px]:border-[#e3e1de]"
                    colSpan={6}
                  >
                    <button
                      className="grid w-full cursor-pointer grid-cols-[8%_21%_20%_20%_17%_14%] items-center border-0 bg-white px-[.45rem] py-[.7rem] text-left max-[700px]:grid-cols-2 max-[700px]:gap-x-4 max-[700px]:gap-y-3 max-[700px]:p-3"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : question.id)}
                    >
                      <span className="min-w-0 overflow-hidden pr-2 text-[.7rem] text-ellipsis whitespace-nowrap max-[700px]:grid max-[700px]:gap-1 max-[700px]:overflow-visible max-[700px]:whitespace-normal">
                        <small className="hidden text-[.6rem] font-semibold text-[#72787d] max-[700px]:block">
                          Question
                        </small>
                        {question.position + 1}
                      </span>
                      <span className="min-w-0 overflow-hidden pr-2 text-[.7rem] text-ellipsis whitespace-nowrap max-[700px]:grid max-[700px]:gap-1 max-[700px]:overflow-visible max-[700px]:text-right max-[700px]:whitespace-normal">
                        <small className="hidden text-[.6rem] font-semibold text-[#72787d] max-[700px]:block">
                          Section
                        </small>
                        {question.sectionTitle}
                      </span>
                      <span className="min-w-0 overflow-hidden pr-2 text-[.7rem] text-ellipsis whitespace-nowrap max-[700px]:grid max-[700px]:gap-1 max-[700px]:overflow-visible max-[700px]:whitespace-normal">
                        <small className="hidden text-[.6rem] font-semibold text-[#72787d] max-[700px]:block">
                          Your answer
                        </small>
                        {answerText(question)}
                      </span>
                      <span className="min-w-0 overflow-hidden pr-2 text-[.7rem] text-ellipsis whitespace-nowrap max-[700px]:grid max-[700px]:gap-1 max-[700px]:overflow-visible max-[700px]:text-right max-[700px]:whitespace-normal">
                        <small className="hidden text-[.6rem] font-semibold text-[#72787d] max-[700px]:block">
                          Correct answer
                        </small>
                        {answerText(question, true)}
                      </span>
                      <span className="min-w-0 pr-2 max-[700px]:grid max-[700px]:gap-1">
                        <small className="hidden text-[.6rem] font-semibold text-[#72787d] max-[700px]:block">
                          Result
                        </small>
                        <b
                          className={`inline-flex w-max max-w-full rounded-full px-[.45rem] py-1 text-[.6rem] capitalize ${reviewStatusClass(state)}`}
                        >
                          {state}
                        </b>
                      </span>
                      <span
                        className="grid place-items-center text-center max-[700px]:justify-self-end"
                        aria-label={
                          expanded ? "Collapse answer" : "View answer"
                        }
                      >
                        <svg
                          className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m8 10 4 4 4-4" />
                        </svg>
                      </span>
                    </button>
                    {expanded ? (
                      <div className="bg-[#faf8f5] px-8 pt-4 pb-5 max-[700px]:px-3">
                        <strong className="text-[.75rem]">
                          Question {question.position + 1}
                        </strong>
                        <p className="text-[.82rem] leading-relaxed">
                          {question.stem}
                        </p>
                        {question.options.length ? (
                          <div className="grid grid-cols-2 gap-[.4rem] max-[700px]:grid-cols-1">
                            {question.options.map((option, index) => (
                              <p
                                className={`m-0 flex gap-2 rounded-[.35rem] border p-[.6rem] text-[.72rem] ${
                                  option.isCorrect
                                    ? "border-[#a8d8b9] bg-[#effaf3]"
                                    : option.selected
                                      ? "border-[#efb2ad] bg-[#fff2f1]"
                                      : "border-[#e1dfdc] bg-white"
                                }`}
                                key={option.id}
                              >
                                <b>{String.fromCharCode(65 + index)}.</b>{" "}
                                {option.body}
                                {option.selected ? (
                                  <small className="ml-auto text-[.58rem] text-[#6d7479]">
                                    Your answer
                                  </small>
                                ) : null}
                                {option.isCorrect ? (
                                  <small className="ml-auto text-[.58rem] text-[#6d7479]">
                                    Correct answer
                                  </small>
                                ) : null}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <article className="mt-[.8rem] border-l-[3px] border-prep-orange bg-white p-[.8rem]">
                          <b>Explanation</b>
                          <p className="mt-[.35rem] mb-0 text-[.74rem] leading-[1.5] text-[#565d62]">
                            {question.explanation ||
                              "No explanation was provided for this question."}
                          </p>
                        </article>
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length ? (
          <p className="p-8 text-center text-[#777d82]">
            No {filter} questions in this attempt.
          </p>
        ) : null}
      </div>
    </section>
  );
}
