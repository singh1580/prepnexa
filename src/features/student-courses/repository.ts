import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type StudentCourse = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  syllabus: string | null;
  coverObjectKey: string | null;
  pricePaise: number;
  currency: string;
  accessDays: number;
  accessSource: "FREE" | "PURCHASED";
  startsAt: Date | null;
  expiresAt: Date | null;
  testCount: number;
  materialCount: number;
  completedAttempts: number;
  activeAttemptId: string | null;
  activeTestTitle: string | null;
  accessStatus?: "ACTIVE" | "EXPIRED";
};

export type CourseTest = {
  id: string;
  title: string;
  category: "FULL_MOCK" | "SUBJECT_TEST" | "TOPIC_SET" | null;
  mode: "PRACTICE" | "MOCK" | "LIVE";
  durationMinutes: number;
  maxAttempts: number;
  questionCount: number;
  attemptsUsed: number;
  activeAttemptId: string | null;
  latestResultId: string | null;
  latestScore: string | null;
  latestMaxScore: string | null;
};

export type CourseMaterial = {
  id: string;
  title: string;
  subject:string;
  topic:string;
  type: "PDF" | "VIDEO" | "FILE";
  allowDownload: boolean;
  version: number | null;
  originalFileName: string | null;
  sizeBytes: number | null;
  lastAccessed:Date|null;
  viewed:boolean;
};

export type CourseResult = {
  id: string;
  attemptId: string;
  testId: string;
  title: string;
  sequence: number;
  score: string;
  maxScore: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  publishedAt: Date;
};

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) {
  return value.rows as T[];
}

export async function listAccessibleCourses(userId: string) {
  const result = await db.execute(sql`
    select p.id, p.slug, p.name, p.description, p.syllabus, p.cover_object_key as "coverObjectKey", p.price_paise as "pricePaise", p.currency,
      p.access_days as "accessDays",
      case when p.price_paise = 0 then 'FREE' else 'PURCHASED' end as "accessSource",
      access.starts_at as "startsAt", access.expires_at as "expiresAt",
      (select count(*)::int from product_tests pt where pt.product_id=p.id) as "testCount",
      (select count(*)::int from product_materials pm where pm.product_id=p.id) as "materialCount",
      (select count(*)::int from attempts a
        where a.product_id=p.id and a.user_id=${userId}::uuid and a.status='EVALUATED') as "completedAttempts",
      active.id as "activeAttemptId", active.title as "activeTestTitle"
    from products p
    left join lateral (
      select e.starts_at, e.expires_at from entitlements e
      where e.product_id=p.id and e.user_id=${userId}::uuid and e.status='ACTIVE'
        and e.starts_at<=now() and e.expires_at>now()
      order by e.expires_at desc limit 1
    ) access on true
    left join lateral (
      select a.id, t.title from attempts a
      join tests t on t.id=a.test_id
      where a.product_id=p.id and a.user_id=${userId}::uuid and a.status in ('CREATED','IN_PROGRESS')
      order by a.updated_at desc limit 1
    ) active on true
    where (p.is_live=true and p.price_paise=0) or access.expires_at is not null
    order by active.id is not null desc, p.name
  `);
  return rows<StudentCourse>(result);
}

export async function findAccessibleCourse(slug: string, userId: string) {
  const courseResult = await db.execute(sql`
    select p.id, p.slug, p.name, p.description, p.syllabus, p.cover_object_key as "coverObjectKey", p.price_paise as "pricePaise", p.currency,
      p.access_days as "accessDays",
      case when p.price_paise=0 then 'FREE' else 'PURCHASED' end as "accessSource",
      access.starts_at as "startsAt", access.expires_at as "expiresAt",
      (select count(*)::int from product_tests pt where pt.product_id=p.id) as "testCount",
      (select count(*)::int from product_materials pm where pm.product_id=p.id) as "materialCount",
      (select count(*)::int from attempts a
        where a.product_id=p.id and a.user_id=${userId}::uuid and a.status='EVALUATED') as "completedAttempts",
      active.id as "activeAttemptId", active.title as "activeTestTitle"
    from products p
    left join lateral (
      select e.starts_at, e.expires_at from entitlements e
      where e.product_id=p.id and e.user_id=${userId}::uuid and e.status='ACTIVE'
        and e.starts_at<=now() and e.expires_at>now()
      order by e.expires_at desc limit 1
    ) access on true
    left join lateral (
      select a.id, t.title from attempts a join tests t on t.id=a.test_id
      where a.product_id=p.id and a.user_id=${userId}::uuid and a.status in ('CREATED','IN_PROGRESS')
      order by a.updated_at desc limit 1
    ) active on true
    where p.slug=${slug} and ((p.is_live=true and p.price_paise=0) or access.expires_at is not null)
    limit 1
  `);
  const course = rows<StudentCourse>(courseResult)[0];
  if (!course) return undefined;

  const [testResult, materialResult, resultResult] = await Promise.all([
    db.execute(sql`
      select t.id, t.title, t.category, t.mode, t.duration_minutes as "durationMinutes",
        t.max_attempts as "maxAttempts",
        (select count(*)::int from test_questions tq where tq.test_id=t.id) as "questionCount",
        (select count(*)::int from attempts a where a.user_id=${userId}::uuid and a.product_id=${course.id}::uuid and a.test_id=t.id and a.status<>'VOID') as "attemptsUsed",
        active.id as "activeAttemptId", latest.id as "latestResultId", latest.score as "latestScore",
        latest.max_score as "latestMaxScore"
      from product_tests pt join tests t on t.id=pt.test_id
      left join lateral (
        select a.id from attempts a where a.user_id=${userId}::uuid and a.product_id=${course.id}::uuid and a.test_id=t.id
          and a.status in ('CREATED','IN_PROGRESS') order by a.created_at desc limit 1
      ) active on true
      left join lateral (
        select r.id, r.score, r.max_score from attempts a join results r on r.attempt_id=a.id
        where a.user_id=${userId}::uuid and a.product_id=${course.id}::uuid and a.test_id=t.id and r.status in ('PUBLISHED','REVISED')
        order by r.published_at desc, r.version desc limit 1
      ) latest on true
      where pt.product_id=${course.id}::uuid order by t.title
    `),
    db.execute(sql`
      select m.id, m.title,m.subject,m.topic, m.type, m.allow_download as "allowDownload", version.version,
        version.original_file_name as "originalFileName", version.size_bytes as "sizeBytes",
        (select max(mal.created_at) from material_access_logs mal where mal.material_id=m.id and mal.product_id=${course.id}::uuid and mal.user_id=${userId}::uuid) as "lastAccessed",
        exists(select 1 from material_access_logs mal where mal.material_id=m.id and mal.product_id=${course.id}::uuid and mal.user_id=${userId}::uuid) as viewed
      from product_materials pm join materials m on m.id=pm.material_id
      left join lateral (
        select mv.version, mv.original_file_name, mv.size_bytes from material_versions mv
        where mv.material_id=m.id order by mv.version desc limit 1
      ) version on true
      where pm.product_id=${course.id}::uuid order by m.title
    `),
    db.execute(sql`
      select distinct on (a.id) r.id, r.attempt_id as "attemptId", a.test_id as "testId", t.title,
        a.sequence, r.score, r.max_score as "maxScore", r.correct_count as "correctCount",
        r.incorrect_count as "incorrectCount", r.unanswered_count as "unansweredCount",
        r.time_spent_seconds as "timeSpentSeconds", r.published_at as "publishedAt"
      from product_tests pt join tests t on t.id=pt.test_id join attempts a on a.test_id=t.id
      join results r on r.attempt_id=a.id
      where pt.product_id=${course.id}::uuid and a.product_id=${course.id}::uuid and a.user_id=${userId}::uuid
        and r.status in ('PUBLISHED','REVISED')
      order by a.id, r.version desc
    `),
  ]);

  const results = rows<CourseResult>(resultResult).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  return {
    ...course,
    tests: rows<CourseTest>(testResult),
    materials: rows<CourseMaterial>(materialResult),
    results,
  };
}

export async function getStudentCourseDashboard(userId: string) {
  const coursesPromise = listAccessibleCourses(userId);
  const summaryPromise = db.execute(sql`
    select
      (select count(*)::int from notifications where user_id=${userId}::uuid and read_at is null) as "unreadNotifications",
      (select count(*)::int from orders where user_id=${userId}::uuid) as orders,
      (select count(*)::int from support_tickets where user_id=${userId}::uuid and status not in ('RESOLVED','CLOSED')) as "openTickets",
      latest.id as "latestResultId", latest.title as "latestResultTitle", latest.slug as "latestResultCourseSlug",
      latest.score as "latestResultScore", latest.max_score as "latestResultMaxScore",
      latest.published_at as "latestResultPublishedAt"
    from (select 1) seed
    left join lateral (
      select r.id, r.score, r.max_score, r.published_at, t.title, p.slug
      from results r join attempts a on a.id=r.attempt_id join tests t on t.id=a.test_id
      join products p on p.id=a.product_id
      where a.user_id=${userId}::uuid and r.status in ('PUBLISHED','REVISED')
        and ((p.is_live=true and p.price_paise=0) or exists(
          select 1 from entitlements e where e.product_id=p.id and e.user_id=${userId}::uuid
            and e.status='ACTIVE' and e.starts_at<=now() and e.expires_at>now()
        ))
      order by r.published_at desc limit 1
    ) latest on true
  `);
  const recentPromise=db.execute(sql`
    select recent.id,recent.score,recent."maxScore",recent."publishedAt",recent.title,recent.slug from (
      select distinct on (r.id) r.id,r.score,r.max_score as "maxScore",r.published_at as "publishedAt",t.title,p.slug
      from results r join attempts a on a.id=r.attempt_id join tests t on t.id=a.test_id
      join products p on p.id=a.product_id
      where a.user_id=${userId}::uuid and r.status in('PUBLISHED','REVISED')
      order by r.id,r.published_at desc,p.slug
    ) recent order by recent."publishedAt" desc limit 5
  `);
  const[courses,summaryResult,recentResult]=await Promise.all([coursesPromise,summaryPromise,recentPromise]);
  const summary = rows<{
    unreadNotifications: number;
    orders: number;
    openTickets: number;
    latestResultId: string | null;
    latestResultTitle: string | null;
    latestResultCourseSlug: string | null;
    latestResultScore: string | null;
    latestResultMaxScore: string | null;
    latestResultPublishedAt: Date | null;
  }>(summaryResult)[0];
  const recentResults=rows<{id:string;score:string;maxScore:string;publishedAt:Date;title:string;slug:string}>(recentResult);
  return { courses, summary, recentResults };
}

export async function listOwnedCourses(userId:string){
  const result=await db.execute(sql`
    select p.id,p.slug,p.name,p.description,p.syllabus,p.cover_object_key as "coverObjectKey",p.price_paise as "pricePaise",p.currency,p.access_days as "accessDays",'PURCHASED' as "accessSource",
      e.starts_at as "startsAt",e.expires_at as "expiresAt",case when e.status='ACTIVE' and e.expires_at>now() then 'ACTIVE' else 'EXPIRED' end as "accessStatus",
      (select count(*)::int from product_tests pt where pt.product_id=p.id) as "testCount",
      (select count(*)::int from product_materials pm where pm.product_id=p.id) as "materialCount",
      (select count(*)::int from attempts a where a.product_id=p.id and a.user_id=${userId}::uuid and a.status='EVALUATED') as "completedAttempts",
      active.id as "activeAttemptId",active.title as "activeTestTitle"
    from products p join lateral(select x.* from entitlements x where x.product_id=p.id and x.user_id=${userId}::uuid order by x.expires_at desc limit 1)e on true
    left join lateral(select a.id,t.title from attempts a join tests t on t.id=a.test_id where a.product_id=p.id and a.user_id=${userId}::uuid and a.status in('CREATED','IN_PROGRESS') order by a.updated_at desc limit 1)active on true
    order by (e.status='ACTIVE' and e.expires_at>now()) desc,e.expires_at desc,p.name
  `);return rows<StudentCourse>(result);
}
