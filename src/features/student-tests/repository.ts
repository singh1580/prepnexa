import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { attemptAnswers, attempts, exams, questionRevisionOptions, questionRevisions, questions, testQuestions, testSections, tests } from "@/db/schema";

export type StudentTestAccess = {
  id: string; title: string; category: "FULL_MOCK" | "SUBJECT_TEST" | "TOPIC_SET" | null;
  durationMinutes: number; instructions: string | null; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean;
  examName: string; questionCount: number; hasAccess: boolean; attemptsUsed: number; activeAttemptId: string | null;
};

type StartQuestion = {
  questionId: string; revisionId: string; sectionId: string; sectionOrder: number; questionOrder: number;
  topicId: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT"; stem: string;
  explanation: string | null; marks: string; negativeMarks: string; answerConfig: Record<string, unknown>;
  options: { id: string; stableKey: string; body: string; isCorrect: boolean; sortOrder: number }[];
};

export type StartContext = StudentTestAccess & { sections: { id: string; title: string; sortOrder: number }[]; questions: StartQuestion[] };

export type AttemptSnapshotInput = {
  id: string; questionId: string; revisionId: string; sectionId: string; topicId: string;
  type: StartQuestion["type"]; position: number; stem: string; explanation: string | null;
  marks: string; negativeMarks: string; answerConfig: Record<string, unknown>;
  options: { id: string; stableKey: string; body: string; isCorrect: boolean; position: number }[];
};

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export async function expireStudentAttempts(userId: string) {
  await db.update(attempts).set({ status: "AUTO_SUBMITTED", submittedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(attempts.userId, userId), inArray(attempts.status, ["CREATED", "IN_PROGRESS"]), sql`${attempts.serverDeadlineAt} <= now()`));
}

export async function listStudentTests(userId: string) {
  const result = await db.execute(sql`
    select t.id, t.title, t.category, t.duration_minutes as "durationMinutes", t.max_attempts as "maxAttempts",
      e.name as "examName",
      (select count(*)::int from test_questions tq where tq.test_id = t.id) as "questionCount",
      (select count(*)::int from attempts a where a.user_id = ${userId} and a.test_id = t.id and a.status <> 'VOID') as "attemptsUsed",
      (select a.id from attempts a where a.user_id = ${userId} and a.test_id = t.id and a.status in ('CREATED','IN_PROGRESS') order by a.created_at desc limit 1) as "activeAttemptId"
    from tests t join exams e on e.id = t.exam_id
    where t.status = 'PUBLISHED' and e.status = 'PUBLISHED' and (
      exists (select 1 from product_tests pt join products p on p.id = pt.product_id where pt.test_id = t.id and p.status = 'PUBLISHED' and p.price_paise = 0)
      or exists (select 1 from product_tests pt join products p on p.id = pt.product_id join entitlements en on en.product_id = p.id
        where pt.test_id = t.id and en.user_id = ${userId} and en.status = 'ACTIVE' and en.starts_at <= now() and en.expires_at > now())
    ) order by e.name, t.title
  `);
  return rows<Omit<StudentTestAccess, "instructions" | "shuffleQuestions" | "shuffleOptions" | "hasAccess">>(result);
}

export async function findStudentTestAccess(testId: string, userId: string): Promise<StudentTestAccess | undefined> {
  const result = await db.execute(sql`
    select t.id, t.title, t.category, t.duration_minutes as "durationMinutes", t.instructions,
      t.max_attempts as "maxAttempts", t.shuffle_questions as "shuffleQuestions", t.shuffle_options as "shuffleOptions",
      e.name as "examName", (select count(*)::int from test_questions tq where tq.test_id = t.id) as "questionCount",
      (select count(*)::int from attempts a where a.user_id = ${userId} and a.test_id = t.id and a.status <> 'VOID') as "attemptsUsed",
      (select a.id from attempts a where a.user_id = ${userId} and a.test_id = t.id and a.status in ('CREATED','IN_PROGRESS') order by a.created_at desc limit 1) as "activeAttemptId",
      (exists (select 1 from product_tests pt join products p on p.id = pt.product_id where pt.test_id = t.id and p.status = 'PUBLISHED' and p.price_paise = 0)
        or exists (select 1 from product_tests pt join products p on p.id = pt.product_id join entitlements en on en.product_id = p.id
          where pt.test_id = t.id and en.user_id = ${userId} and en.status = 'ACTIVE' and en.starts_at <= now() and en.expires_at > now())) as "hasAccess"
    from tests t join exams e on e.id = t.exam_id
    where t.id = ${testId} and t.status = 'PUBLISHED' and e.status = 'PUBLISHED' limit 1
  `);
  return rows<StudentTestAccess>(result)[0];
}

export async function findActiveAttempt(userId: string) {
  return db.query.attempts.findFirst({ where: and(eq(attempts.userId, userId), inArray(attempts.status, ["CREATED", "IN_PROGRESS"])), orderBy: desc(attempts.createdAt) });
}

export async function findStartContext(testId: string, userId: string): Promise<StartContext | undefined> {
  const access = await findStudentTestAccess(testId, userId);
  if (!access) return undefined;
  const [sections, revisionRows] = await Promise.all([
    db.select({ id: testSections.id, title: testSections.title, sortOrder: testSections.sortOrder }).from(testSections).where(eq(testSections.testId, testId)).orderBy(asc(testSections.sortOrder)),
    db.select({ questionId: questions.id, revisionId: questionRevisions.id, sectionId: testQuestions.sectionId, sectionOrder: testSections.sortOrder, questionOrder: testQuestions.sortOrder,
      topicId: questions.topicId, type: questions.type, stem: questionRevisions.stem, explanation: questionRevisions.explanation,
      marks: questionRevisions.marks, negativeMarks: questionRevisions.negativeMarks, answerConfig: questionRevisions.answerConfig })
      .from(testQuestions).innerJoin(testSections, eq(testSections.id, testQuestions.sectionId)).innerJoin(questions, eq(questions.id, testQuestions.questionId))
      .innerJoin(questionRevisions, and(eq(questionRevisions.questionId, questions.id), sql`${questionRevisions.version} = (select max(qr.version) from question_revisions qr where qr.question_id = ${questions.id} and qr.published_at is not null)`))
      .where(eq(testQuestions.testId, testId)).orderBy(asc(testSections.sortOrder), asc(testQuestions.sortOrder)),
  ]);
  const revisionIds = revisionRows.map(item => item.revisionId);
  const optionRows = revisionIds.length ? await db.select().from(questionRevisionOptions).where(inArray(questionRevisionOptions.revisionId, revisionIds)).orderBy(asc(questionRevisionOptions.sortOrder)) : [];
  const mapped = revisionRows.map(question => ({ ...question, options: optionRows.filter(option => option.revisionId === question.revisionId) }));
  return { ...access, sections, questions: mapped };
}

export async function createAttemptWithSnapshots(input: { attemptId: string; userId: string; testId: string; sequence: number; deadline: Date; sections: StartContext["sections"]; snapshots: AttemptSnapshotInput[]; requestId: string }) {
  const sectionPayload = input.sections.map(section => ({ attemptId: input.attemptId, sectionId: section.id }));
  const snapshotPayload = input.snapshots.map(snapshot => ({ id: snapshot.id, attemptId: input.attemptId, questionId: snapshot.questionId, revisionId: snapshot.revisionId, sectionId: snapshot.sectionId, topicId: snapshot.topicId, type: snapshot.type, position: snapshot.position, stem: snapshot.stem, explanation: snapshot.explanation, marks: snapshot.marks, negativeMarks: snapshot.negativeMarks, answerConfig: snapshot.answerConfig }));
  const optionPayload = input.snapshots.flatMap(snapshot => snapshot.options.map(option => ({ ...option, questionSnapshotId: snapshot.id })));
  const result = await db.execute(sql`
    with inserted_attempt as (
      insert into attempts (id, user_id, test_id, status, sequence, started_at, server_deadline_at, created_at, updated_at)
      values (${input.attemptId}::uuid, ${input.userId}::uuid, ${input.testId}::uuid, 'IN_PROGRESS', ${input.sequence}, now(), ${input.deadline}, now(), now())
      returning id
    ), inserted_sections as (
      insert into attempt_section_states (attempt_id, section_id, started_at, deadline_at)
      select x."attemptId"::uuid, x."sectionId"::uuid, now(), ${input.deadline}
      from jsonb_to_recordset(${JSON.stringify(sectionPayload)}::jsonb) as x("attemptId" text, "sectionId" text)
      where exists (select 1 from inserted_attempt) returning attempt_id
    ), inserted_questions as (
      insert into attempt_question_snapshots (id, attempt_id, question_id, revision_id, section_id, topic_id, type, position, stem, explanation, marks, negative_marks, answer_config)
      select x.id::uuid, x."attemptId"::uuid, x."questionId"::uuid, x."revisionId"::uuid, x."sectionId"::uuid, x."topicId"::uuid,
        x.type::question_type, x.position, x.stem, x.explanation, x.marks::numeric, x."negativeMarks"::numeric, x."answerConfig"::jsonb
      from jsonb_to_recordset(${JSON.stringify(snapshotPayload)}::jsonb) as x(id text, "attemptId" text, "questionId" text, "revisionId" text, "sectionId" text, "topicId" text, type text, position int, stem text, explanation text, marks text, "negativeMarks" text, "answerConfig" jsonb)
      where exists (select 1 from inserted_attempt) returning id
    ), inserted_options as (
      insert into attempt_option_snapshots (id, question_snapshot_id, stable_key, body, is_correct, position)
      select x.id::uuid, x."questionSnapshotId"::uuid, x."stableKey", x.body, x."isCorrect", x.position
      from jsonb_to_recordset(${JSON.stringify(optionPayload)}::jsonb) as x(id text, "questionSnapshotId" text, "stableKey" text, body text, "isCorrect" boolean, position int)
      where x."questionSnapshotId"::uuid in (select id from inserted_questions) returning id
    ), audit as (
      insert into audit_logs (actor_user_id, action, entity_type, entity_id, request_id, after)
      select ${input.userId}::uuid, 'attempt.started', 'attempt', id::text, ${input.requestId}::text,
        jsonb_build_object('testId', ${input.testId}::text, 'sequence', ${input.sequence}::integer)
      from inserted_attempt returning id
    ) select id from inserted_attempt
  `);
  return rows<{ id: string }>(result)[0];
}

export async function findAttemptForStudent(attemptId: string, userId: string) {
  await db.update(attempts).set({ status: "AUTO_SUBMITTED", submittedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), inArray(attempts.status, ["CREATED", "IN_PROGRESS"]), sql`${attempts.serverDeadlineAt} <= now()`));
  const [attempt] = await db.select({ id: attempts.id, testId: attempts.testId, status: attempts.status, sequence: attempts.sequence, startedAt: attempts.startedAt,
    serverDeadlineAt: attempts.serverDeadlineAt, submittedAt: attempts.submittedAt, title: tests.title, durationMinutes: tests.durationMinutes, examName: exams.name })
    .from(attempts).innerJoin(tests, eq(tests.id, attempts.testId)).innerJoin(exams, eq(exams.id, tests.examId))
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId))).limit(1);
  if (!attempt) return undefined;
  const [sectionRows, questionRows, optionRows, answerRows] = await Promise.all([
    db.execute(sql`select s.id, s.title, s.sort_order as "sortOrder" from attempt_section_states st join test_sections s on s.id = st.section_id where st.attempt_id = ${attemptId} order by s.sort_order`),
    db.execute(sql`select id, question_id as "questionId", section_id as "sectionId", type, position, stem, marks, negative_marks as "negativeMarks" from attempt_question_snapshots where attempt_id = ${attemptId} order by position`),
    db.execute(sql`select o.id, o.question_snapshot_id as "questionSnapshotId", o.body, o.position from attempt_option_snapshots o join attempt_question_snapshots q on q.id = o.question_snapshot_id where q.attempt_id = ${attemptId} order by o.position`),
    db.select({ questionId: attemptAnswers.questionId, selectedOptionIds: attemptAnswers.selectedOptionIds, textAnswer: attemptAnswers.textAnswer, numericAnswer: attemptAnswers.numericAnswer, markedForReview: attemptAnswers.markedForReview, version: attemptAnswers.version, savedAt: attemptAnswers.savedAt }).from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId)),
  ]);
  const options = rows<{ id: string; questionSnapshotId: string; body: string; position: number }>(optionRows);
  const answers = new Map(answerRows.map(answer => [answer.questionId, answer]));
  const questions = rows<{ id: string; questionId: string; sectionId: string; type: StartQuestion["type"]; position: number; stem: string; marks: string; negativeMarks: string }>(questionRows).map(question => ({
    ...question, options: options.filter(option => option.questionSnapshotId === question.id), answer: answers.get(question.questionId) ?? { selectedOptionIds: [], textAnswer: null, numericAnswer: null, markedForReview: false, version: 0, savedAt: null },
  }));
  return { ...attempt, serverTime: new Date(), sections: rows<{ id: string; title: string; sortOrder: number }>(sectionRows), questions };
}

export async function findAnswerTarget(attemptId: string, snapshotId: string, userId: string) {
  const result = await db.execute(sql`
    select a.status, a.server_deadline_at as "serverDeadlineAt", q.question_id as "questionId", q.type,
      coalesce(ans.version, 0)::int as version,
      coalesce((select jsonb_agg(o.id) from attempt_option_snapshots o where o.question_snapshot_id = q.id), '[]'::jsonb) as "optionIds"
    from attempts a join attempt_question_snapshots q on q.attempt_id = a.id
    left join attempt_answers ans on ans.attempt_id = a.id and ans.question_id = q.question_id
    where a.id = ${attemptId} and a.user_id = ${userId} and q.id = ${snapshotId} limit 1
  `);
  return rows<{ status: string; serverDeadlineAt: Date; questionId: string; type: StartQuestion["type"]; version: number; optionIds: string[] }>(result)[0];
}

export async function saveAnswerRecord(input: { attemptId: string; snapshotId: string; userId: string; questionId: string; selectedOptionIds: string[]; textAnswer: string | null; numericAnswer: string | null; markedForReview: boolean; version: number }) {
  const result = await db.execute(sql`
    insert into attempt_answers (attempt_id, question_id, selected_option_ids, text_answer, numeric_answer, marked_for_review, version, saved_at)
    select a.id, q.question_id, ${JSON.stringify(input.selectedOptionIds)}::jsonb, ${input.textAnswer}, ${input.numericAnswer}::numeric, ${input.markedForReview}, 1, now()
    from attempts a join attempt_question_snapshots q on q.attempt_id = a.id
    where a.id = ${input.attemptId} and a.user_id = ${input.userId} and q.id = ${input.snapshotId}
      and a.status = 'IN_PROGRESS' and a.server_deadline_at > now() and ${input.version} = 0
    on conflict (attempt_id, question_id) do update set selected_option_ids = excluded.selected_option_ids,
      text_answer = excluded.text_answer, numeric_answer = excluded.numeric_answer, marked_for_review = excluded.marked_for_review,
      version = attempt_answers.version + 1, saved_at = now()
    where attempt_answers.version = ${input.version}
    returning version, saved_at as "savedAt"
  `);
  return rows<{ version: number; savedAt: Date }>(result)[0];
}

export async function submitAttemptRecord(attemptId: string, userId: string, requestId: string) {
  const result = await db.execute(sql`
    with submitted as (
      update attempts set status = case when server_deadline_at <= now() then 'AUTO_SUBMITTED'::attempt_status else 'SUBMITTED'::attempt_status end,
        submitted_at = now(), updated_at = now()
      where id = ${attemptId} and user_id = ${userId} and status in ('CREATED','IN_PROGRESS')
      returning id, status, submitted_at
    ), closed_sections as (
      update attempt_section_states set submitted_at = (select submitted_at from submitted)
      where attempt_id in (select id from submitted) and submitted_at is null returning attempt_id
    ), audit as (
      insert into audit_logs (actor_user_id, action, entity_type, entity_id, request_id, after)
      select ${userId}::uuid, case when status = 'AUTO_SUBMITTED' then 'attempt.auto_submitted' else 'attempt.submitted' end,
        'attempt', id::text, ${requestId}, jsonb_build_object('status', status) from submitted returning id
    ) select id, status, submitted_at as "submittedAt" from submitted
  `);
  return rows<{ id: string; status: "SUBMITTED" | "AUTO_SUBMITTED"; submittedAt: Date }>(result)[0];
}

export async function findAttemptOwnerStatus(attemptId: string, userId: string) {
  return db.query.attempts.findFirst({ where: and(eq(attempts.id, attemptId), eq(attempts.userId, userId)) });
}

export function stableOrder(seed: string, id: string) { return createHash("sha256").update(`${seed}:${id}`).digest("hex"); }
export { randomUUID };
