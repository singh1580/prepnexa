"use client";

import { useState } from "react";

export type TopicOption = { id: string; topicName: string; subjectName: string; examName: string };

export function TopicPicker({ topics, value, onChange, name }: { topics: TopicOption[]; value: string; onChange: (id: string) => void; name?: string }) {
  const [exam, setExam] = useState("");
  const [subject, setSubject] = useState("");
  const [query, setQuery] = useState("");
  const exams = [...new Set(topics.map(topic => topic.examName))];
  const subjects = [...new Set(topics.filter(topic => !exam || topic.examName === exam).map(topic => topic.subjectName))];
  const visible = topics.filter(topic => (!exam || topic.examName === exam) && (!subject || topic.subjectName === subject) && topic.topicName.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = topics.find(topic => topic.id === value);
  const pinned = selected && !visible.some(topic => topic.id === value);
  return <div>
    <div className="question-grid">
      {exams.length > 1 && <label className="field"><span>Filter exam</span><select value={exam} onChange={event => { setExam(event.target.value); setSubject(""); }}><option value="">All exams</option>{exams.map(item => <option key={item}>{item}</option>)}</select></label>}
      <label className="field"><span>Filter subject</span><select value={subject} onChange={event => setSubject(event.target.value)}><option value="">All subjects</option>{subjects.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Search topic</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <label className="field"><span>Topic · {visible.length} matching</span><select name={name} value={value} onChange={event => onChange(event.target.value)} required>
      <option value="" disabled>Choose a topic</option>
      {pinned && <option value={selected.id}>Current selection: {selected.examName} · {selected.subjectName} · {selected.topicName}</option>}
      {visible.map(topic => <option value={topic.id} key={topic.id}>{topic.examName} · {topic.subjectName} · {topic.topicName}</option>)}
    </select></label>
    {!visible.length && <p className="muted">No matching topics. Clear the filters or try another name.</p>}
    {pinned && <p className="muted">Your selected topic is outside these filters. It stays selected until you choose another topic.</p>}
    {(exam || subject || query) && <button className="text-button" type="button" onClick={() => { setExam(""); setSubject(""); setQuery(""); }}>Clear topic filters</button>}
  </div>;
}
