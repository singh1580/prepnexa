import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { ScoringQuestion } from "./scoring";

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export async function findAttemptForScoring(attemptId: string, userId: string) {
  const result = await db.execute(sql`
    select a.id, a.test_id as "testId", a.status, a.started_at as "startedAt", a.submitted_at as "submittedAt", t.duration_minutes as "durationMinutes",
      q.question_id as "questionId", q.section_id as "sectionId", q.topic_id as "topicId", q.type,
      q.marks, q.negative_marks as "negativeMarks", q.answer_config as "answerConfig",
      coalesce(ans.selected_option_ids, '[]'::jsonb) as "selectedOptionIds", ans.text_answer as "textAnswer", ans.numeric_answer as "numericAnswer",
      coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'isCorrect', o.is_correct) order by o.position)
        from attempt_option_snapshots o where o.question_snapshot_id = q.id), '[]'::jsonb) as options
    from attempts a join tests t on t.id=a.test_id join attempt_question_snapshots q on q.attempt_id = a.id
    left join attempt_answers ans on ans.attempt_id = a.id and ans.question_id = q.question_id
    where a.id = ${attemptId} and a.user_id = ${userId}
    order by q.position
  `);
  const values = rows<ScoringQuestion & { id: string; testId: string; status: string; startedAt: Date | null; submittedAt: Date | null; durationMinutes: number }>(result);
  if (!values.length) return undefined;
  return { id: values[0].id, testId: values[0].testId, status: values[0].status, startedAt: values[0].startedAt, submittedAt: values[0].submittedAt, durationMinutes: values[0].durationMinutes,
    questions: values.map(item => ({ questionId: item.questionId, sectionId: item.sectionId, topicId: item.topicId, type: item.type,
      marks: item.marks, negativeMarks: item.negativeMarks, answerConfig: item.answerConfig, options: item.options,
      selectedOptionIds: item.selectedOptionIds, textAnswer: item.textAnswer, numericAnswer: item.numericAnswer })) };
}

export async function findPendingStudentAttempts(userId: string) {
  const result = await db.execute(sql`
    select a.id from attempts a where a.user_id = ${userId} and a.status in ('SUBMITTED','AUTO_SUBMITTED')
      and not exists (select 1 from results r where r.attempt_id = a.id)
    order by a.submitted_at limit 5
  `);
  return rows<{ id: string }>(result);
}

export async function persistInitialResult(input: { attemptId: string; userId: string; requestId: string; timeSpentSeconds: number;
  score: string; maxScore: string; correctCount: number; incorrectCount: number; unansweredCount: number;
  questions: { questionId: string; correct: boolean; awardedMarks: string }[];
  sections: { sectionId: string; score: string; maxScore: string; correctCount: number; incorrectCount: number; unansweredCount: number }[];
  topics: { topicId: string; score: string; maxScore: string; correctCount: number; attemptedCount: number }[] }) {
  const resultId = randomUUID();
  const result = await db.execute(sql`
    with created_result as (
      insert into results (id, attempt_id, version, status, score, max_score, correct_count, incorrect_count, unanswered_count, time_spent_seconds, calculated_at, published_at, created_at)
      select ${resultId}::uuid, a.id, 1, 'PUBLISHED', ${input.score}::numeric, ${input.maxScore}::numeric,
        ${input.correctCount}, ${input.incorrectCount}, ${input.unansweredCount}, ${input.timeSpentSeconds}, now(), now(), now()
      from attempts a where a.id = ${input.attemptId} and a.user_id = ${input.userId} and a.status in ('SUBMITTED','AUTO_SUBMITTED')
      on conflict (attempt_id, version) do nothing returning id
    ), scored_answers as (
      update attempt_answers ans set is_correct = x.correct, awarded_marks = x."awardedMarks"::numeric
      from jsonb_to_recordset(${JSON.stringify(input.questions)}::jsonb) as x("questionId" uuid, correct boolean, "awardedMarks" text), created_result r
      where ans.attempt_id = ${input.attemptId} and ans.question_id = x."questionId" returning ans.question_id
    ), saved_sections as (
      insert into section_results (result_id, section_id, score, max_score, correct_count, incorrect_count, unanswered_count, time_spent_seconds)
      select r.id, x."sectionId", x.score::numeric, x."maxScore"::numeric, x."correctCount", x."incorrectCount", x."unansweredCount", 0
      from created_result r cross join jsonb_to_recordset(${JSON.stringify(input.sections)}::jsonb)
        as x("sectionId" uuid, score text, "maxScore" text, "correctCount" int, "incorrectCount" int, "unansweredCount" int)
      returning result_id
    ), saved_topics as (
      insert into topic_results (result_id, topic_id, score, max_score, correct_count, attempted_count)
      select r.id, x."topicId", x.score::numeric, x."maxScore"::numeric, x."correctCount", x."attemptedCount"
      from created_result r cross join jsonb_to_recordset(${JSON.stringify(input.topics)}::jsonb)
        as x("topicId" uuid, score text, "maxScore" text, "correctCount" int, "attemptedCount" int)
      returning result_id
    ), evaluated as (
      update attempts set status = 'EVALUATED', updated_at = now() where id = ${input.attemptId} and exists (select 1 from created_result) returning id
    ), audit as (
      insert into audit_logs (actor_user_id, action, entity_type, entity_id, request_id, after)
      select ${input.userId}::uuid, 'result.published', 'result', r.id::text, ${input.requestId}::text,
        jsonb_build_object('attemptId', ${input.attemptId}::text, 'score', ${input.score}::text) from created_result r returning id
    ) select id from created_result
  `);
  return rows<{ id: string }>(result)[0];
}

export async function findResultIdByAttempt(attemptId: string, userId: string) {
  const result = await db.execute(sql`select r.id from results r join attempts a on a.id=r.attempt_id where r.attempt_id=${attemptId} and a.user_id=${userId} order by r.version desc limit 1`);
  return rows<{ id: string }>(result)[0];
}

export async function listStudentResults(userId: string) {
  const result = await db.execute(sql`
    select distinct on (a.id) r.id, r.attempt_id as "attemptId", r.score, r.max_score as "maxScore", r.correct_count as "correctCount",
      r.incorrect_count as "incorrectCount", r.unanswered_count as "unansweredCount", r.time_spent_seconds as "timeSpentSeconds",
      r.published_at as "publishedAt", t.title, e.name as "examName", a.sequence
    from attempts a join results r on r.attempt_id=a.id join tests t on t.id=a.test_id join exams e on e.id=t.exam_id
    where a.user_id=${userId} and r.status in ('PUBLISHED','REVISED')
    order by a.id, r.version desc
  `);
  return rows<{ id: string; attemptId: string; score: string; maxScore: string; correctCount: number; incorrectCount: number; unansweredCount: number; timeSpentSeconds: number; publishedAt: Date; title: string; examName: string; sequence: number }>(result)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function findStudentResult(resultId: string, userId: string) {
  const summaryResult = await db.execute(sql`
    select r.id, r.attempt_id as "attemptId", r.version, r.status, r.score, r.max_score as "maxScore", r.correct_count as "correctCount",
      r.incorrect_count as "incorrectCount", r.unanswered_count as "unansweredCount", r.time_spent_seconds as "timeSpentSeconds",
      r.published_at as "publishedAt", t.id as "testId", t.title, e.name as "examName", a.sequence
    from results r join attempts a on a.id=r.attempt_id join tests t on t.id=a.test_id join exams e on e.id=t.exam_id
    where r.id=${resultId} and a.user_id=${userId} and r.status in ('PUBLISHED','REVISED') limit 1
  `);
  const summary = rows<Record<string, unknown>>(summaryResult)[0];
  if (!summary) return undefined;
  const attemptId = summary.attemptId as string;
  const [sectionsResult, topicsResult, questionsResult] = await Promise.all([
    db.execute(sql`select s.title, sr.score, sr.max_score as "maxScore", sr.correct_count as "correctCount", sr.incorrect_count as "incorrectCount", sr.unanswered_count as "unansweredCount" from section_results sr join test_sections s on s.id=sr.section_id where sr.result_id=${resultId} order by s.sort_order`),
    db.execute(sql`select tp.name, su.name as "subjectName", tr.score, tr.max_score as "maxScore", tr.correct_count as "correctCount", tr.attempted_count as "attemptedCount" from topic_results tr join topics tp on tp.id=tr.topic_id join subjects su on su.id=tp.subject_id where tr.result_id=${resultId} order by su.sort_order,tp.sort_order`),
    db.execute(sql`
      select q.id, q.position, q.stem, q.explanation, q.type, q.marks, q.negative_marks as "negativeMarks",
        ans.selected_option_ids as "selectedOptionIds", ans.text_answer as "textAnswer", ans.numeric_answer as "numericAnswer",
        coalesce(ans.is_correct,false) as "isCorrect", coalesce(ans.awarded_marks,0) as "awardedMarks",
        q.answer_config as "answerConfig", s.title as "sectionTitle", tp.name as "topicName",
        coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'body',o.body,'isCorrect',o.is_correct,'selected',coalesce(ans.selected_option_ids,'[]'::jsonb) ? o.id::text) order by o.position) from attempt_option_snapshots o where o.question_snapshot_id=q.id),'[]'::jsonb) as options
      from attempt_question_snapshots q join test_sections s on s.id=q.section_id join topics tp on tp.id=q.topic_id
      left join attempt_answers ans on ans.attempt_id=q.attempt_id and ans.question_id=q.question_id
      where q.attempt_id=${attemptId} order by q.position
    `),
  ]);
  return { ...summary, sections: rows<Record<string, unknown>>(sectionsResult), topics: rows<Record<string, unknown>>(topicsResult), questions: rows<Record<string, unknown>>(questionsResult) };
}
