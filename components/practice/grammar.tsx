"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCheck } from "lucide-react";
import { EmptyState, ErrorNotice } from "@/components/ui";
import { request, formatDate } from "@/lib/client";
import type { GrammarCatalog, GrammarReview } from "@/lib/practice";
import { list, message, Options, PracticeLoadState, useTimer, useUnsavedWork } from "./shared";

export function GrammarPractice({ initialId }: { initialId?: string }) {
  const [topics, setTopics] = useState<GrammarCatalog | null>(null);
  const [selected, setSelected] = useState<GrammarCatalog[number] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [review, setReview] = useState<GrammarReview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const timer = useTimer();
  const { reset } = timer;
  const confirmLeave = useUnsavedWork(Boolean(selected && !review && Object.keys(answers).length), "Your grammar answers have not been checked or saved. Leave this exercise?");
  useEffect(() => {
    let cancelled = false;
    request<GrammarCatalog>("/api/practice/grammar").then((items) => {
      if (cancelled) return;
      setTopics(items);
      const found = items.find((item) => item.id === initialId);
      if (found) { setSelected(found); setAnswers({}); setReview(null); reset(0, true); }
      else if (initialId) setError("That lesson is no longer in your library. Choose another below.");
    }).catch((error) => { if (!cancelled) setError(message(error)); });
    return () => { cancelled = true; };
  }, [initialId, reset, reload]);
  function open(topic: GrammarCatalog[number]) { setSelected(topic); setAnswers({}); setReview(null); setError(""); timer.reset(0, true); }
  async function submit() {
    if (!selected || busy) return;
    const unanswered = selected.exercises.filter((exercise) => !answers[exercise.id]).length;
    if (unanswered && !window.confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered and will count as incorrect. Check your answers now?`)) return;
    setBusy(true); setError("");
    try {
      const result = await request<GrammarReview>("/api/practice/grammar", { topicId: selected.id, answers, durationSeconds: Math.min(timer.seconds, 14400) });
      setReview(result); timer.pause();
      const updated = { ...selected, attempts: [result, ...selected.attempts] };
      setTopics((current) => current?.map((topic) => topic.id === selected.id ? updated : topic) ?? null); setSelected(updated);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  if (!topics) return <PracticeLoadState error={error} onRetry={() => { setError(""); setReload((value) => value + 1); }}/>;
  if (!selected) return <><ErrorNotice message={error}/>{topics.length === 0 && <EmptyState icon={<CheckCheck size={24}/>} title="No grammar lessons yet" description="Your lesson library is empty."/>}<div className="content-list">{topics.map((topic) => <section className="panel" key={topic.id}><div className="panel-heading"><span className="icon-box green"><CheckCheck size={20}/></span><span className="pill">{topic.exercises.length} exercises</span></div><h2>{topic.title}</h2><p className="muted" style={{ margin: "12px 0 20px" }}>{topic.lesson.slice(0, 160)}…</p><button className="button primary" onClick={() => open(topic)}>Open lesson<ArrowRight size={15}/></button>{topic.attempts.length > 0 && <p className="small-note" style={{ marginTop: 14 }}>Last attempt: {topic.attempts[0].score}% · {formatDate(topic.attempts[0].createdAt)}</p>}</section>)}</div></>;
  return <><div className="toolbar practice-topbar"><button className="button" disabled={busy} onClick={() => { if (confirmLeave()) { setSelected(null); timer.pause(); } }}><ArrowLeft size={14}/>Lesson library</button><span className="pill green">{review ? "Saved result" : `${Object.keys(answers).length} / ${selected.exercises.length} answered`}</span></div><ErrorNotice message={error}/><div className="two-column"><div className="stack"><section className="panel"><p className="eyebrow">The principle</p><h2>{selected.title}</h2><div className="lesson-rules">{Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(selected.lesson), (part) => part.segment.trim()).map((rule, index) => <p key={index}>{rule}</p>)}</div></section>{selected.attempts.length > 0 && <section className="panel"><h2>Practice history</h2>{selected.attempts.map((attempt) => <details key={attempt.id} className="history-row"><summary><strong>{formatDate(attempt.createdAt)}</strong><span className="pill green">{attempt.score}%</span></summary>{Array.isArray(attempt.answers) && attempt.answers.map((answer, index) => answer && typeof answer === "object" && !Array.isArray(answer) && typeof answer.question === "string" && typeof answer.answer === "string" && typeof answer.explanation === "string" ? <div className="question-card" key={index}><h3>{answer.question}</h3><p>Your answer: {typeof answer.userAnswer === "string" && answer.userAnswer ? answer.userAnswer : "Unanswered"}</p><p>Correct answer: {answer.answer}</p><p className="small-note">{answer.explanation}</p></div> : null)}</details>)}</section>}</div><section className="panel"><h2>{review ? "Your result" : "Put it into practice"}</h2>{!review && <><p className="small-note" style={{ marginTop: 10 }}>Choose one answer for each question. Use the rule on the left to explain your choice.</p><nav className="toolbar" aria-label="Grammar question navigator" style={{ marginTop: 16 }}>{selected.exercises.map((exercise, index) => <a className={`button small ${answers[exercise.id] ? "soft" : ""}`} key={exercise.id} href={`#grammar-${exercise.id}`} aria-label={`Question ${index + 1}, ${answers[exercise.id] ? "answered" : "unanswered"}`}>{index + 1}</a>)}</nav></>}{review && <div className="notice success" role="status"><strong>{review.review.filter((item) => item.isCorrect).length} / {review.review.length} correct · {review.score}%</strong><p>Saved to your history. Incorrect answers are also available in Mistakes.</p></div>}{selected.exercises.map((exercise, index) => {
    const result = review?.review.find((item) => item.id === exercise.id);
    return <div className="question-card" id={`grammar-${exercise.id}`} key={exercise.id}><h3>{index + 1}. {exercise.question}</h3>{result ? <><span className={`pill ${result.isCorrect ? "green" : "red"}`}>{result.isCorrect ? "Correct" : "Needs review"}</span><p style={{ marginTop: 12 }}>Your answer: <strong>{result.userAnswer || "Unanswered"}</strong></p><p>Correct answer: <strong>{result.answer}</strong></p><p className="notice">{result.explanation}</p></> : <Options id={exercise.id} options={list(exercise.options)} value={answers[exercise.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))} disabled={busy}/>}</div>;
  })}{review ? <button className="button primary" onClick={() => open(selected)}>Practise again</button> : <><p className="small-note" style={{ marginBottom: 12 }}>{selected.exercises.filter((exercise) => !answers[exercise.id]).length} unanswered · your result saves when you check your answers.</p><button className="button primary" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Check and save answers"}</button></>}</section></div></>;
}
