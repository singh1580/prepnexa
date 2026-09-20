import { randomUUID, createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { parseQuestionCsv } from "@/features/admin-imports/question-csv";
import type { QuestionInput } from "@/features/admin-content/repository";
import { testStateConflict } from "./errors";

type Actor = { userId: string; requestId: string };

export async function importTestCsv(sectionId: string, topicId: string, csv: string, actor: Actor) {
  const parsed = parseQuestionCsv(csv, topicId);
  if (parsed.issues.length) return { status: "INVALID" as const, totalRows: parsed.totalRows, importedRows: 0, issues: parsed.issues };
  return addTestQuestions(sectionId, parsed.questions, actor);
}

// A single statement inserts the paper questions, answers and section assignments.
// A rejected destination writes nothing; a database error rolls back every CTE.
export async function addTestQuestions(sectionId: string, inputs: QuestionInput[], actor: Actor, replacesQuestionId?: string) {
  if (replacesQuestionId && inputs.length !== 1) throw testStateConflict("Edit one question at a time.");
  if (!inputs.length) throw testStateConflict("Add at least one question.");
  const records = inputs.map((input, position) => ({
    ...input, position, id: randomUUID(), revisionId: randomUUID(),
    answerConfig: input.type === "NUMERIC" ? { type: input.type, value: input.numericAnswer, tolerance: input.numericTolerance }
      : input.type === "TEXT" ? { type: input.type, acceptedAnswers: input.acceptedAnswers, caseSensitive: input.caseSensitive }
        : { type: input.type, correctOptionKeys: input.options.filter(option => option.isCorrect).map(option => option.stableKey) },
  }));
  const jobId = randomUUID();
  const fingerprint = createHash("sha256").update(JSON.stringify(inputs)).digest("hex");
  const result = await db.execute(sql`
    with source as (
      select * from jsonb_to_recordset(${JSON.stringify(records)}::jsonb) as r(
        id uuid, "revisionId" uuid, "topicId" uuid, type text, stem text, explanation text,
        marks numeric, "negativeMarks" numeric, difficulty text, options jsonb,
        "answerConfig" jsonb, position integer)
    ), locked_test as (
      select t.id, t.exam_id from tests t join test_sections s on s.test_id = t.id
      where s.id = ${sectionId}::uuid and t.status = 'DRAFT' and t.mode = 'MOCK'
      for update of t
    ), locked_assignment as (
      select a.* from test_questions a join locked_test t on t.id = a.test_id
      where a.section_id = ${sectionId}::uuid and a.question_id = ${replacesQuestionId ?? null}::uuid
      for update of a
    ), destination as (
      select t.* from locked_test t where (${replacesQuestionId ?? null}::uuid is null or exists (select 1 from locked_assignment)) and not exists (
        select 1 from source r where not exists (
          select 1 from topics p join subjects s on s.id = p.subject_id
          where p.id = r."topicId" and s.exam_id = t.exam_id
        )
      )
    ), new_questions as (
      insert into questions (id, topic_id, type, stem, explanation, marks, negative_marks, difficulty, status, created_by)
      select r.id, r."topicId", r.type::question_type, r.stem, r.explanation, r.marks,
        r."negativeMarks", r.difficulty, 'DRAFT', ${actor.userId}::uuid
      from source r cross join destination returning id
    ), new_revisions as (
      insert into question_revisions (id, question_id, version, stem, explanation, marks, negative_marks, answer_config, created_by)
      select r."revisionId", r.id, 1, r.stem, r.explanation, r.marks, r."negativeMarks", r."answerConfig", ${actor.userId}::uuid
      from source r join new_questions q on q.id = r.id returning id
    ), new_options as (
      insert into question_options (question_id, body, is_correct, sort_order)
      select r.id, o->>'body', (o->>'isCorrect')::boolean, (o->>'sortOrder')::integer
      from source r join new_questions q on q.id = r.id cross join lateral jsonb_array_elements(r.options) o
    ), new_revision_options as (
      insert into question_revision_options (revision_id, stable_key, body, is_correct, sort_order)
      select r."revisionId", o->>'stableKey', o->>'body', (o->>'isCorrect')::boolean, (o->>'sortOrder')::integer
      from source r join new_revisions v on v.id = r."revisionId" cross join lateral jsonb_array_elements(r.options) o
    ), assignments as (
      ${replacesQuestionId ? sql`
        update test_questions a set question_id = (select id from new_questions)
        where a.section_id = ${sectionId}::uuid and a.question_id = ${replacesQuestionId}::uuid
          and a.test_id in (select id from destination)
          and exists (select 1 from new_questions)
        returning a.test_id
      ` : sql`
        insert into test_questions (test_id, section_id, question_id, sort_order)
        select d.id, ${sectionId}::uuid, r.id,
          coalesce((select max(sort_order) + 1 from test_questions where section_id = ${sectionId}::uuid), 0) + r.position
        from source r join new_questions q on q.id = r.id cross join destination d returning test_id
      `}
    ), import_job as (
      insert into content_import_jobs (id, type, status, object_key, total_rows, valid_rows, invalid_rows, requested_by, completed_at)
      select ${jobId}::uuid, ${replacesQuestionId ? 'TEST_QUESTION_EDIT' : 'TEST_QUESTIONS'}, 'IMPORTED', ${`inline-sha256:${fingerprint}`},
        ${inputs.length}, ${inputs.length}, 0, ${actor.userId}::uuid, now()
      from destination where exists (select 1 from assignments) returning id
    )
    insert into audit_logs (actor_user_id, action, entity_type, entity_id, request_id, "after")
    select ${actor.userId}::uuid, ${replacesQuestionId ? 'test.question_edited' : 'test.questions_added'}, 'test', d.id::text, ${actor.requestId},
      jsonb_build_object('replacesQuestionId', ${replacesQuestionId ?? null}::text, 'sectionId', ${sectionId}::text, 'importJobId', j.id::text, 'questionIds',
        (select jsonb_agg(id) from new_questions))
    from destination d cross join import_job j returning entity_id
  `);
  if (!result.rows.length) throw testStateConflict(replacesQuestionId ? "This question or test changed, or the selected topic belongs to another exam. Return to the test and refresh before editing." : "Choose a topic from this exam and a section in a draft mock test. Refresh if the test changed.");
  return { id: jobId, status: "IMPORTED" as const, totalRows: inputs.length, importedRows: inputs.length, issues: [] };
}
