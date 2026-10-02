"use client";

import { useMemo, useState } from "react";

export type ReviewQuestionView={id:string;position:number;stem:string;explanation:string|null;type:string;selectedOptionIds:string[]|null;textAnswer:string|null;numericAnswer:string|null;isCorrect:boolean;sectionTitle:string;answerConfig:Record<string,unknown>;options:{id:string;body:string;isCorrect:boolean;selected:boolean}[]};
type Filter="all"|"correct"|"incorrect"|"unanswered";

function isAnswered(question:ReviewQuestionView){return Boolean(question.selectedOptionIds?.length||question.textAnswer?.trim()||question.numericAnswer!=null)}
function status(question:ReviewQuestionView){return question.isCorrect?"correct":isAnswered(question)?"incorrect":"unanswered"}
function answerText(question:ReviewQuestionView,correct=false){
  if(question.options.length){const values=question.options.filter(option=>correct?option.isCorrect:option.selected).map(option=>option.body);return values.join(", ")||"—"}
  if(question.type==="NUMERIC")return correct?String(question.answerConfig.value??"—"):question.numericAnswer??"—";
  const accepted=question.answerConfig.acceptedAnswers;return correct?(Array.isArray(accepted)?accepted.join(", "):"—"):question.textAnswer||"—";
}

export function ResultReviewTable({questions}:{questions:ReviewQuestionView[]}){
  const[filter,setFilter]=useState<Filter>("all");const[open,setOpen]=useState<string|null>(null);
  const counts=useMemo(()=>questions.reduce((value,question)=>{value[status(question)]++;return value},{correct:0,incorrect:0,unanswered:0}),[questions]);
  const visible=filter==="all"?questions:questions.filter(question=>status(question)===filter);
  const filters:[Filter,string,number][]=[["all","All",questions.length],["correct","Correct",counts.correct],["incorrect","Incorrect",counts.incorrect],["unanswered","Unanswered",counts.unanswered]];
  return <section className="reference-question-review"><h2>Question review</h2><nav aria-label="Filter question review">{filters.map(([key,label,count])=><button type="button" className={filter===key?"active":""} aria-pressed={filter===key} onClick={()=>setFilter(key)} key={key}>{label} ({count})</button>)}</nav><div className="review-table-wrap"><table><thead><tr><th>Q. No.</th><th>Section</th><th>Your answer</th><th>Correct answer</th><th>Result</th><th>Action</th></tr></thead><tbody>{visible.map(question=>{const state=status(question),expanded=open===question.id;return <tr className={`${state}${expanded?" expanded":""}`} key={question.id}><td colSpan={6}><button className="review-row-summary" type="button" aria-expanded={expanded} onClick={()=>setOpen(expanded?null:question.id)}><span>{question.position+1}</span><span>{question.sectionTitle}</span><span>{answerText(question)}</span><span>{answerText(question,true)}</span><span><b className={`review-status ${state}`}>{state}</b></span><span className="review-chevron">⌄</span></button>{expanded?<div className="review-row-detail"><strong>Question {question.position+1}</strong><p>{question.stem}</p>{question.options.length?<div>{question.options.map((option,index)=><p className={`${option.isCorrect?"correct-option":""}${option.selected?" selected-option":""}`} key={option.id}><b>{String.fromCharCode(65+index)}.</b> {option.body}{option.selected?<small>Your answer</small>:null}{option.isCorrect?<small>Correct answer</small>:null}</p>)}</div>:null}<article><b>Explanation</b><p>{question.explanation||"No explanation was provided for this question."}</p></article></div>:null}</td></tr>})}</tbody></table>{!visible.length?<p className="review-empty">No {filter} questions in this attempt.</p>:null}</div></section>;
}
