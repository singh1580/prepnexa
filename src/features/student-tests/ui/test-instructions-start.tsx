"use client";

import { useState } from "react";
import Link from "next/link";
import { StartAttemptButton } from "./start-button";

export function TestInstructionsStart({testId,activeAttemptId,courseSlug,exhausted}:{testId:string;activeAttemptId:string|null;courseSlug?:string;exhausted:boolean}){
  const[accepted,setAccepted]=useState(Boolean(activeAttemptId));
  const backHref=courseSlug?`/dashboard/courses/${encodeURIComponent(courseSlug)}?view=tests`:"/dashboard/tests";
  return <div className="instruction-start-block"><label className="instruction-confirm"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/><span>I have read and understood the instructions. I am ready to begin the test.</span></label><div className="instruction-button-row"><Link className="reference-back-button" href={backHref}>← <span>Back to package</span></Link>{exhausted?<div className="notice danger">You have used all available attempts.</div>:<StartAttemptButton testId={testId} activeAttemptId={activeAttemptId} courseSlug={courseSlug} disabled={!accepted}/>}</div></div>;
}
