"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import { EmptyState, ErrorNotice } from "@/components/ui";
import { request, formatDate, label } from "@/lib/client";
import type { ReadingCatalog, ReadingReview } from "@/lib/practice";
import { list, message, Options, PracticeLoadState, time, useTimer, useUnsavedWork } from "./shared";

export function ReadingPractice({ initialId }: { initialId?: string }) {
  const [passages, setPassages] = useState<ReadingCatalog | null>(null);
  const [selected, setSelected] = useState<ReadingCatalog[number] | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [review, setReview] = useState<ReadingReview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const timer = useTimer();
  const { reset } = timer;
  const confirmLeave = useUnsavedWork(Boolean(selected && !review && (Object.values(answers).some(Boolean) || notes.trim())), "Your reading answers have not been submitted. Leave without saving this attempt?");
  useEffect(() => {
    let cancelled = false;
    request<ReadingCatalog>("/api/practice/reading").then(async (items) => {
      if (cancelled) return;
      setPassages(items);
      const found = items.find((item) => item.id === initialId);
      if (found) {
        const attempt = await request<{ id: string }>("/api/practice/reading?action=start", { passageId: found.id });
        if (cancelled) return;
        setSelected(found); setAttemptId(attempt.id); setAnswers({}); setNotes(""); setReview(null); reset(0, true);
      }
      else if (initialId) setError("That passage is no longer in your library. Choose another below.");
    }).catch((error) => { if (!cancelled) setError(message(error)); });
    return () => { cancelled = true; };
  }, [initialId, reset, reload]);
  async function start(passage: ReadingCatalog[number]) {
    setBusy(true); setError("");
    try {
      const attempt = await request<{ id: string }>("/api/practice/reading?action=start", { passageId: passage.id });
      setSelected(passage); setAttemptId(attempt.id); setAnswers({}); setNotes(""); setReview(null); setOnlyWrong(false); timer.reset(0, true);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function submit() {
    if (busy || !selected) return;
    const unanswered = selected.questions.filter((question) => !answers[question.id]?.trim()).length;
    if (unanswered && !window.confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered and will count as incorrect. Submit this attempt?`)) return;
    setBusy(true); setError("");
    try {
      const result = await request<ReadingReview>("/api/practice/reading", { attemptId, answers, notes });
      timer.pause(); setReview(result); setOnlyWrong(false);
      setPassages((current) => current?.map((passage) => passage.id === result.passageId ? { ...passage, attempts: [result, ...passage.attempts.filter((attempt) => attempt.id !== result.id)] } : passage) ?? null);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function openReview(passage: ReadingCatalog[number], id: string) {
    setBusy(true); setError("");
    try { setReview(await request<ReadingReview>(`/api/practice/reading?attemptId=${encodeURIComponent(id)}`)); setSelected(passage); setOnlyWrong(false); timer.pause(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  if (!passages) return <PracticeLoadState error={error} onRetry={() => { setError(""); setReload((value) => value + 1); }}/>;
  if (!selected) return <><ErrorNotice message={error}/>{passages.length === 0 && <EmptyState icon={<BookOpen size={24}/>} title="No reading passages yet" description="Your passage library is empty."/>}<div className="two-column">{passages.map((passage) => <section key={passage.id} className="panel"><div className="panel-heading"><span className="icon-box blue"><BookOpen size={20}/></span><span className="pill">Original practice</span></div><h2>{passage.title}</h2><p className="muted" style={{ margin: "12px 0 20px" }}>{passage.topic} · {passage.questions.length} questions · {label(passage.difficulty)}</p><div className="toolbar"><span className="small-note"><Clock size={13} style={{ display: "inline", verticalAlign: "middle" }}/> {passage.timeLimitMinutes} minute target</span><button disabled={busy} className="button primary" onClick={() => start(passage)}>Start reading<ArrowRight size={15}/></button></div>{passage.attempts.filter((attempt) => attempt.completedAt).map((attempt) => <button key={attempt.id} className="button small" style={{ margin: "6px 6px 0 0" }} onClick={() => openReview(passage, attempt.id)} disabled={busy}>Review {formatDate(attempt.startedAt)} · {attempt.score}%</button>)}</section>)}</div><p className="small-note" style={{ marginTop: 20 }}>Practise True / False / Not Given, multiple choice and sentence completion. The passages describe fictional examples written for this app.</p></>;
  const correct = review?.answers.filter((answer) => answer.isCorrect).length ?? 0;
  return <><div className="toolbar practice-topbar"><button className="button" disabled={busy} onClick={() => { if (confirmLeave()) { setSelected(null); timer.pause(); } }}><ArrowLeft size={14}/>Passage library</button><span className="pill green">{review ? "Saved review" : `${Object.values(answers).filter(Boolean).length} / ${selected.questions.length} answered`}</span><div className="timer-meta" style={{ marginLeft: "auto" }}><span className="timer" aria-label="Elapsed reading time">{time(review?.durationSeconds ?? timer.seconds)}</span><span className="small-note">{review ? "Total practice time" : timer.seconds >= selected.timeLimitMinutes * 60 ? "Target reached · submit when ready" : `${time(selected.timeLimitMinutes * 60 - timer.seconds)} until your target`}</span></div></div><ErrorNotice message={error}/>{review && <div className="notice success" role="status"><strong>{correct} / {review.answers.length} correct · {review.score}%</strong><p>Your answers and explanations are saved. Review the evidence below, then try the passage again.</p><button className="button small" style={{ marginTop: 12 }} onClick={() => start(selected)} disabled={busy}>Try again</button></div>}<div className="reading-layout"><article className="panel"><p className="eyebrow">{selected.topic}</p><h2 style={{ marginBottom: 20 }}>{selected.title}</h2><div className="reading-text practice-passage">{selected.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index} id={`passage-${String.fromCharCode(65 + index)}`}>{paragraph}</p>)}</div></article><section className="panel" id="reading-questions"><h2>{review ? "Answer review" : "Your answers"}</h2>{review && <div className="choice-row"><button className={`button small ${!onlyWrong ? "soft" : ""}`} aria-pressed={!onlyWrong} onClick={() => setOnlyWrong(false)}>All answers</button><button className={`button small ${onlyWrong ? "soft" : ""}`} aria-pressed={onlyWrong} disabled={correct === review.answers.length} onClick={() => setOnlyWrong(true)}>Needs review ({review.answers.length - correct})</button></div>}{!review && <><p className="small-note" style={{ marginTop: 8 }}>Target: {selected.timeLimitMinutes} minutes. Submit when ready; unanswered questions count as incorrect. Your answers save on submission.</p><nav className="toolbar" aria-label="Question navigator" style={{ marginTop: 16 }}>{selected.questions.map((question) => <a key={question.id} aria-label={`Question ${question.order}, ${answers[question.id] ? "answered" : "unanswered"}`} className={`button small ${answers[question.id] ? "soft" : ""}`} href={`#question-${question.id}`}>{question.order}</a>)}</nav></>}{selected.questions.filter((question) => !onlyWrong || !review?.answers.find((answer) => answer.questionId === question.id)?.isCorrect).map((question) => {
    const result = review?.answers.find((answer) => answer.questionId === question.id);
    const options = list(question.options);
    return <div className="question-card" id={`question-${question.id}`} key={question.id}><span className="pill">{question.order} · {label(question.type)}</span><h3 style={{ marginTop: 12 }}>{question.question}</h3>{result ? <><p><span className={`pill ${result.isCorrect ? "green" : "red"}`}>{result.isCorrect ? "Correct" : "Needs review"}</span></p><p style={{ marginTop: 12 }}>Your answer: <strong>{result.userAnswer || "Unanswered"}</strong></p><p>Correct answer: <strong>{result.expectedAnswer}</strong></p><blockquote style={{ margin: "16px 0", borderLeft: "3px solid var(--primary)", paddingLeft: 12 }}><a className="text-link" href={`#passage-${result.question.paragraph}`}>View paragraph {result.question.paragraph}</a><p style={{ marginTop: 6 }}>{result.question.evidence}</p></blockquote><p>{result.question.explanation}</p><p className="small-note" style={{ marginTop: 12 }}><strong>Question trap:</strong> {result.question.trap}</p><p className="notice"><strong>Next time:</strong> {result.question.tip}</p></> : options.length ? <Options id={question.id} options={options} value={question.type === "MULTIPLE_CHOICE" ? options.find((option) => option.startsWith(`${answers[question.id]}.`)) ?? "" : answers[question.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: question.type === "MULTIPLE_CHOICE" ? value.slice(0, 1) : value }))} disabled={busy}/> : <label>Answer<input maxLength={500} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} disabled={busy}/></label>}</div>;
  })}{!review ? <><label>Reading notes<textarea disabled={busy} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={50000} placeholder="Keywords, uncertainties, or a strategy to remember…"/></label><p className="small-note" style={{ marginTop: 16 }}>{selected.questions.filter((question) => !answers[question.id]?.trim()).length} unanswered · answers save when you submit.</p><button className="button primary" style={{ marginTop: 18 }} onClick={submit} disabled={busy}>{busy ? "Saving…" : "Submit and review"}<ArrowRight size={15}/></button></> : review.notes && <div className="notice"><strong>Your notes</strong><p style={{ whiteSpace: "pre-wrap" }}>{review.notes}</p></div>}</section></div></>;
}
