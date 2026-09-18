"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mic, Save } from "lucide-react";
import { EmptyState, ErrorNotice } from "@/components/ui";
import { request, formatDate } from "@/lib/client";
import type { SpeakingCatalog } from "@/lib/practice";
import { list, message, PracticeLoadState, TeachingSample, Timer, time, useTimer, useUnsavedWork } from "./shared";

type Question = SpeakingCatalog[number]["questions"][number];

export function SpeakingPractice({ initialId }: { initialId?: string }) {
  const [topics, setTopics] = useState<SpeakingCatalog | null>(null);
  const [part, setPart] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [mistakeNotes, setMistakeNotes] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [reload, setReload] = useState(0);
  const timer = useTimer();
  const { reset } = timer;
  const canSave = Boolean(notes.trim() || transcript.trim() || (!preparing && timer.seconds > 0));
  const hasUnsavedWork = Boolean(question && !saved && (canSave || mistakeNotes.trim()));
  const confirmLeave = useUnsavedWork(hasUnsavedWork || busy, "Your speaking practice has not been saved. Leave without saving these notes and reflections?");
  useEffect(() => {
    let cancelled = false;
    request<SpeakingCatalog>("/api/practice/speaking").then((items) => {
      if (cancelled) return;
      setTopics(items);
      const found = items.flatMap((topic) => topic.questions).find((item) => item.id === initialId);
      setNotes(""); setTranscript(""); setMistakeNotes(""); setSaved(false); reset();
      if (found) { setQuestion(found); setPart(found.part); setPreparing(found.part === 2); }
      else { setQuestion(null); if (initialId) setError("That question is no longer in your library. Choose another below."); }
    }).catch((error) => { if (!cancelled) setError(message(error)); });
    return () => { cancelled = true; };
  }, [initialId, reset, reload]);
  function open(value: Question) { setQuestion(value); setNotes(""); setTranscript(""); setMistakeNotes(""); setError(""); setSaved(false); setPreparing(value.part === 2); timer.reset(); }
  async function save() {
    if (!question || busy || saved || !canSave) return;
    setBusy(true); setError(""); timer.pause();
    try {
      const attempt = await request<Question["attempts"][number]>("/api/practice/speaking", { questionId: question.id, notes, transcript, mistakeNotes, durationSeconds: preparing ? 0 : Math.min(timer.seconds, 14400) });
      const updated = { ...question, attempts: [attempt, ...question.attempts] };
      setTopics((current) => current?.map((topic) => ({ ...topic, questions: topic.questions.map((item) => item.id === question.id ? updated : item) })) ?? null);
      setQuestion(updated); setSaved(true);
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  if (!topics) return <PracticeLoadState error={error} onRetry={() => { setError(""); setReload((value) => value + 1); }}/>;
  if (!question) return <><div className="toolbar">{[1, 2, 3].map((value) => <button aria-pressed={part === value} className={`button ${part === value ? "primary" : ""}`} key={value} onClick={() => setPart(value)}>Part {value} · {value === 1 ? "Everyday questions" : value === 2 ? "Long turn" : "Discussion"}</button>)}</div><ErrorNotice message={error}/>{topics.every((topic) => topic.questions.every((item) => item.part !== part)) && <EmptyState icon={<Mic size={24}/>} title="No questions for this part yet" description="Choose another speaking part to keep practising."/>}<div className="content-list">{topics.filter((topic) => topic.questions.some((item) => item.part === part)).map((topic) => <section key={topic.id} className="panel"><div className="panel-heading"><h2>{topic.name}</h2><span className="icon-box purple"><Mic size={18}/></span></div>{topic.questions.filter((item) => item.part === part).map((item) => <div className="study-row" key={item.id}><div className="study-row-content"><h3>{item.question}</h3><p>{item.attempts.length ? `${item.attempts.length} saved attempts` : "Ready for your first attempt"}</p></div><button className="button" onClick={() => open(item)}>Practise</button></div>)}</section>)}</div><p className="small-note" style={{ marginTop: 20 }}>Use your own experiences. Samples illustrate natural organisation; memorising an answer is not the goal.</p></>;
  return <><div className="toolbar practice-topbar"><button className="button" disabled={busy} onClick={() => { if (confirmLeave()) { setQuestion(null); timer.pause(); } }}><ArrowLeft size={14}/>Question library</button><span className="pill">Part {question.part}</span><span className="save-indicator" aria-live="polite" style={{ marginLeft: "auto" }}>{busy ? "Saving your attempt…" : saved ? "Saved to your library" : hasUnsavedWork ? "Unsaved practice" : "Ready to practise"}</span></div><ErrorNotice message={error}/>{saved && <p className="notice success" role="status">Attempt saved. Your reflection is available below.{mistakeNotes.trim() && " Your observation was also added to Mistakes."}</p>}<div className="two-column"><div className="stack"><section className="panel"><p className="eyebrow">Your question</p><h2>{question.question}</h2>{list(question.cuePoints).length > 0 && <><p style={{ marginTop: 16 }}>You should say:</p><ul style={{ listStyle: "disc", paddingLeft: 20 }}>{list(question.cuePoints).map((point) => <li key={point} style={{ marginTop: 8 }}>{point}</li>)}</ul></>}{question.part === 2 && <div className="choice-row"><button disabled={busy || saved} aria-pressed={preparing} className={`button ${preparing ? "soft" : ""}`} onClick={() => { setPreparing(true); timer.reset(0, true); }}>1-minute preparation</button><button disabled={busy || saved} aria-pressed={!preparing} className={`button ${!preparing ? "soft" : ""}`} onClick={() => { setPreparing(false); timer.reset(0, true); }}>2-minute answer</button></div>}<div style={{ marginTop: 20 }}><Timer timer={timer} disabled={busy || saved} target={question.part === 2 ? preparing ? 60 : 120 : undefined}/></div><p className="small-note">{question.part === 2 ? preparing ? "Write keywords, not full sentences. Switch to the answer timer when you are ready." : "Aim to develop your answer for up to two minutes." : question.part === 1 ? "Give a direct answer, a reason and a small example. Two to four natural sentences are usually enough for this practice." : "Explain your view, support it with reasons, and consider a relevant example or limitation."}</p></section><section className="panel"><h2>A structure to try</h2><ol style={{ listStyle: "decimal", paddingLeft: 20, marginTop: 15 }}>{list(question.structure).map((step) => <li key={step} style={{ marginBottom: 10 }}>{step}</li>)}</ol><h3 style={{ marginTop: 24 }}>Useful language</h3>{list(question.vocabulary).map((word) => <p key={word} style={{ marginTop: 10 }}>{word}</p>)}<div className="history-words">{list(question.phrases).map((phrase) => <span className="pill green" key={phrase}>{phrase}</span>)}</div></section><TeachingSample answer={question.sampleAnswer}/></div><div className="stack"><section className="panel"><h2>Your practice notebook</h2><div className="content-list" style={{ marginTop: 20 }}><label>Ideas and preparation notes<textarea disabled={busy || saved} value={notes} maxLength={50000} onChange={(event) => { setNotes(event.target.value); setSaved(false); }} placeholder="A real example, a detail, a reason…"/></label><label>Your answer (optional)<textarea disabled={busy || saved} value={transcript} rows={7} maxLength={50000} onChange={(event) => { setTranscript(event.target.value); setSaved(false); }} placeholder="Type your answer or a transcript you made yourself."/></label><label>What would you improve next time?<textarea disabled={busy || saved} value={mistakeNotes} maxLength={50000} onChange={(event) => { setMistakeNotes(event.target.value); setSaved(false); }} placeholder="For example: I repeated 'very good'. Next time, give a precise reason."/></label></div><div className="toolbar" style={{ margin: "20px 0 0" }}><button className="button primary" onClick={save} disabled={busy || saved || !canSave}><Save size={15}/>{busy ? "Saving…" : "Save attempt"}</button>{saved && <button className="button" onClick={() => open(question)}>New attempt</button>}</div><p className="small-note" style={{ marginTop: 14 }}>Save your notes or timed answer here. After saving, choose New attempt to practise again. Audio recording and automated feedback are planned.</p></section>{question.attempts.length > 0 && <section className="panel"><h2>Saved attempts</h2>{question.attempts.map((attempt) => <details className="history-row" key={attempt.id}><summary><strong>{formatDate(attempt.createdAt)}</strong><span className="small-note">{time(attempt.durationSeconds)}</span></summary>{attempt.notes && <p style={{ whiteSpace: "pre-wrap" }}><strong>Notes:</strong> {attempt.notes}</p>}{attempt.transcript && <p style={{ whiteSpace: "pre-wrap" }}><strong>Answer:</strong> {attempt.transcript}</p>}{attempt.mistakeNotes && <p style={{ whiteSpace: "pre-wrap" }}><strong>Next time:</strong> {attempt.mistakeNotes}</p>}</details>)}</section>}</div></div></>;
}
