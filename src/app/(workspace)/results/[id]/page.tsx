import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentNotifications } from "@/features/operations/service";
import { ResultReviewTable, type ReviewQuestionView } from "@/features/student-results/result-review-table";
import { getStudentResult } from "@/features/student-results/service";
import { entityIdSchema } from "@/features/student-tests/validation";
import { AppError } from "@/lib/errors/app-error";

type Breakdown={title:string;score:string;maxScore:string;correctCount:number;incorrectCount:number;unansweredCount:number;timeSpentSeconds:number};
type ResultView={title:string;examName:string;score:string;maxScore:string;correctCount:number;incorrectCount:number;unansweredCount:number;timeSpentSeconds:number;publishedAt:Date;sections:Breakdown[];questions:ReviewQuestionView[];testId:string;maxAttempts:number;attemptsUsed:number};
export const metadata={title:"Result analysis"};
function ActionIcon({name}:{name:"back"|"retake"}){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{name==="back"?<><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></>:<><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></>}</svg>}

export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{course?:string}>}){
  const auth=await requireWorkspace();if(auth.admin)redirect("/admin");
  const parsed=entityIdSchema.safeParse((await params).id);if(!parsed.success)notFound();
  const notificationsPromise=getStudentNotifications(auth.user.id);
  let raw;try{raw=await getStudentResult(parsed.data,auth.user.id)}catch(error){if(error instanceof AppError&&error.status===404)notFound();throw error}
  const[result,notifications]=[raw as unknown as ResultView,await notificationsPromise];
  const courseSlug=(await searchParams).course;const courseHref=courseSlug?`/dashboard/courses/${encodeURIComponent(courseSlug)}?view=results`:"/dashboard/courses";
  const attempted=result.correctCount+result.incorrectCount;const accuracy=attempted?Math.round(result.correctCount/attempted*100):0;
  const sections=result.sections.map(section=>{const total=section.correctCount+section.incorrectCount+section.unansweredCount;return{...section,total,accuracy:total?Math.round(section.correctCount/total*100):0}});
  const strengths=sections.filter(section=>section.accuracy>=70).sort((a,b)=>b.accuracy-a.accuracy);
  const needsWork=sections.filter(section=>section.accuracy<70).sort((a,b)=>a.accuracy-b.accuracy);
  return <WorkspaceShell admin={false} name={auth.user.name} section="courses" unreadNotifications={notifications.unreadCount} activePackageSlug={courseSlug} activePackageView="results">
    <nav className="student-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard/courses">My Packages</Link><span>›</span>{courseSlug?<Link href={courseHref}>{courseSlug.replaceAll("-"," ")}</Link>:null}<span>›</span><b>{result.title}</b></nav>
    <header className="result-reference-heading"><h1>{result.title}</h1><p>Completed on {new Date(result.publishedAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}<i/>Time taken: {Math.floor(result.timeSpentSeconds/60)} minutes</p></header>
    <section className="reference-performance"><h2>Your performance</h2><div><article><strong>{result.score}</strong><span>Score<br/>(out of {result.maxScore})</span></article><article><strong>{accuracy}%</strong><span>Accuracy</span></article><article><strong>{result.correctCount}</strong><span>Correct</span></article><article><strong>{result.incorrectCount}</strong><span>Incorrect</span></article><article><strong>{result.unansweredCount}</strong><span>Unanswered</span></article></div></section>
    <section className="reference-section-performance"><h2>Section-wise performance</h2><div className="section-performance-table"><div className="section-performance-head"><span>Section</span><span>Correct / Total</span><span>Accuracy</span><span>Score (out of)</span></div>{sections.map(section=><article key={section.title}><strong>{section.title}</strong><div><span>{section.correctCount} / {section.total}</span><i><b style={{width:`${section.accuracy}%`}}/></i></div><span>{section.accuracy}%</span><span>{section.score} / {section.maxScore}</span></article>)}</div></section>
    <section className="reference-insights"><h2>Strengths and areas to work on</h2><div><article className="strength"><h3>↑ <span>Strengths</span></h3>{strengths.length?<ul>{strengths.map(section=><li key={section.title}>Good accuracy in {section.title} ({section.accuracy}%)</li>)}</ul>:<p>Complete more correct answers to build a strong section.</p>}</article><article className="needs-work"><h3>↓ <span>Needs work</span></h3>{needsWork.length?<ul>{needsWork.map(section=><li key={section.title}>Improve accuracy in {section.title} ({section.accuracy}%)</li>)}</ul>:<p>No weak section detected in this attempt.</p>}</article></div></section>
    <ResultReviewTable questions={result.questions}/>
    <footer className="reference-result-actions"><Link href={courseHref}><ActionIcon name="back"/>Back to package</Link>{result.attemptsUsed<result.maxAttempts?<Link className="retake" href={`/tests/${result.testId}${courseSlug?`?course=${encodeURIComponent(courseSlug)}`:""}`}><ActionIcon name="retake"/>Retake test</Link>:null}</footer>
  </WorkspaceShell>;
}
