"use client";

import Link from "next/link";
import { useState } from "react";
import { testCategoryLabels } from "../categories";

type Exam = { id: string; name: string };
type Subject = { id: string; name: string; examId: string; examName: string };
type Topic = { id: string; name: string; subjectId: string; subjectName: string; examId: string; examName: string };

export function TestListFilters({ exams, subjects, topics, initial }: { exams: Exam[]; subjects: Subject[]; topics: Topic[]; initial: { exam: string; subject: string; topic: string; category: string; status: string; query: string } }) {
  const [exam, setExam] = useState(initial.exam);
  const [subject, setSubject] = useState(initial.subject);
  const [topic, setTopic] = useState(initial.topic);
  const visibleSubjects = subjects.filter(item => !exam || item.examId === exam);
  const visibleTopics = topics.filter(item => (!exam || item.examId === exam) && (!subject || item.subjectId === subject));
  const selectedSubject = visibleSubjects.some(item => item.id === subject) ? subject : "";
  const selectedTopic = visibleTopics.some(item => item.id === topic) ? topic : "";
  return <form className="panel inline-admin-form" method="get" action="/admin/tests">
    <label className="field"><span>Exam</span><select name="exam" value={exam} onChange={event => { setExam(event.target.value); setSubject(""); setTopic(""); }}><option value="">All exams</option>{exams.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="field"><span>Subject</span><select name="subject" value={selectedSubject} onChange={event => { setSubject(event.target.value); setTopic(""); }}><option value="">All subjects</option>{visibleSubjects.map(item => <option key={item.id} value={item.id}>{exam ? item.name : `${item.examName} · ${item.name}`}</option>)}</select></label>
    <label className="field"><span>Topic</span><select name="topic" value={selectedTopic} onChange={event => setTopic(event.target.value)}><option value="">All topics</option>{visibleTopics.map(item => <option key={item.id} value={item.id}>{selectedSubject ? item.name : `${item.examName} · ${item.subjectName} · ${item.name}`}</option>)}</select></label>
    <label className="field"><span>Test type</span><select name="category" defaultValue={initial.category}><option value="">All types</option>{Object.entries(testCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="UNCLASSIFIED">Uncategorised</option></select></label>
    <label className="field"><span>Status</span><select name="status" defaultValue={initial.status}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
    <label className="field"><span>Search test name</span><input name="q" defaultValue={initial.query} maxLength={160} type="search" /></label>
    <button className="button" type="submit">Apply filters</button><Link className="back-link" href="/admin/tests">Clear filters</Link>
  </form>;
}
