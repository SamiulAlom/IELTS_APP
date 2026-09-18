"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, CircleHelp, Clock3, RotateCcw, Sparkles, X } from "lucide-react";
import { ErrorNotice, Loading, PageTitle } from "@/components/ui";
import { label, request } from "@/lib/client";
import { QUIZ_MODES, SOURCES, type Quiz, type QuizAnswer } from "@/types/vocabulary";
import { useStudyTime } from "./use-study-time";

const instructions: Record<string, string> = {
  ENGLISH_TO_BANGLA: "Choose the Bangla meaning", BANGLA_TO_ENGLISH: "Type the English word", SYNONYM: "Choose the closest synonym", DEFINITION: "Which word matches this definition?", FILL_BLANK: "Type the missing word", MULTIPLE_CHOICE: "Choose the word that matches",
};

export function VocabularyQuiz() {
  const params = useSearchParams();
  const selectedIds = params.get("wordIds")?.split(",").filter(Boolean);
  const [source, setSource] = useState(params.get("source") || "learned");
  const [mode, setMode] = useState("MIXED");
  const [count, setCount] = useState(Number(params.get("count")) || selectedIds?.length || 10);
  const [date, setDate] = useState(params.get("date") || "");
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [resume, setResume] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const saving = useRef(false);
  const loadedAttemptId = useRef<string | null>(null);
  const answerInput = useRef<HTMLInputElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const studyTime = useStudyTime(`${quiz?.id ?? "setup"}-${index}`);
  const question = quiz?.questions[index];
  const saved = quiz?.answers.find((entry) => entry.questionId === question?.id);
  const answered = !!saved;
  const hasChoices = !!question?.choices.length;

  useEffect(() => {
    let mounted = true;
    const id = params.get("attempt");
    if (id && loadedAttemptId.current === id) return;
    request<{ attempt: Quiz | null }>(id ? `/api/vocabulary/quiz/${id}` : "/api/vocabulary/quiz").then((result) => {
      if (!mounted) return;
      if (id && result.attempt) {
        loadedAttemptId.current = result.attempt.id;
        setQuiz(result.attempt);
        setShowResults(!!result.attempt.completedAt);
        setMode(result.attempt.mode);
        setIndex(Math.max(0, result.attempt.questions.findIndex((question) => !result.attempt!.answers.some((entry) => entry.questionId === question.id))));
      } else {
        loadedAttemptId.current = null;
        setQuiz(null); setShowResults(false); setAnswer(""); setResume(result.attempt);
      }
    }).catch((reason: Error) => { if (mounted) setError(reason.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [params]);

  useEffect(() => {
    if (showResults) { resultHeading.current?.focus({ preventScroll: true }); return; }
    if (answered) nextButton.current?.focus({ preventScroll: true });
    else if (hasChoices) questionHeading.current?.focus({ preventScroll: true });
    else answerInput.current?.focus({ preventScroll: true });
  }, [question?.id, answered, hasChoices, showResults]);

  async function start(wordIds = selectedIds) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const result = await request<{ attempt: Quiz }>("/api/vocabulary/quiz", { source: wordIds?.length ? "all" : source, mode, count: wordIds?.length ? Math.min(count, wordIds.length) : count, ...(date ? { date } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(wordIds?.length ? { wordIds } : {}) });
      loadedAttemptId.current = result.attempt.id;
      setQuiz(result.attempt); setIndex(0); setAnswer(""); setResume(null); setShowResults(false);
      const url = new URL(window.location.href);
      url.searchParams.set("attempt", result.attempt.id);
      window.history.replaceState(null, "", url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create your test."); }
    finally { saving.current = false; setBusy(false); }
  }

  async function submit(value = answer) {
    if (!quiz || saved || saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const result = await request<{ answer: QuizAnswer; attempt: Quiz }>(`/api/vocabulary/quiz/${quiz.id}`, { questionId: quiz.questions[index].id, userAnswer: value, responseTimeMs: studyTime() });
      setQuiz(result.attempt);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your answer. Please try again."); }
    finally { saving.current = false; setBusy(false); }
  }

  function next() {
    if (!quiz || busy) return;
    if (quiz.completedAt) { setShowResults(true); return; }
    const nextIndex = quiz.questions.findIndex((question, position) => position > index && !quiz.answers.some((entry) => entry.questionId === question.id));
    const first = quiz.questions.findIndex((question) => !quiz.answers.some((entry) => entry.questionId === question.id));
    setIndex(nextIndex >= 0 ? nextIndex : Math.max(0, first)); setAnswer("");
  }

  function keyboard(event: KeyboardEvent<HTMLFormElement>) {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || busy) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable=true]")) return;
    const choice = Number(event.key) - 1;
    if (!saved && question && choice >= 0 && choice < question.choices.length) { event.preventDefault(); setAnswer(question.choices[choice]); }
    if (event.key === "Enter" && !target.closest("button, a")) { event.preventDefault(); if (saved) next(); else if (answer.trim()) void submit(); }
  }

  if (loading) return <Loading message="Getting your vocabulary test ready…"/>;
  const missed = quiz?.answers.filter((entry) => entry.result !== "CORRECT") ?? [];
  return <>
    <PageTitle eyebrow="Practise remembering" title="Vocabulary practice test" description="Choose your words, check each answer, and find out what needs another look."/>
    <div className="practice-container"><ErrorNotice message={error}/>
      {!quiz ? <>
        {resume && <div className="session-resume"><div><strong>Your unfinished test is here.</strong><p>{resume.answers.length} of {resume.questionCount} answers saved · {label(resume.mode)}</p></div><Link className="button primary" href={`/vocabulary/quiz?attempt=${resume.id}`}>Resume test<ArrowRight size={15}/></Link></div>}
        <form className="panel session-setup" onSubmit={(event) => { event.preventDefault(); void start(); }}><span className="icon-box"><CircleHelp size={23}/></span><h2>Give your words a quick check.</h2><p>Every answer helps plan your next review. A close English spelling earns half credit; a correct answer earns one point.</p>
          {selectedIds?.length ? <div className="notice"><p>Testing your selected set of {selectedIds.length} words.</p><Link className="text-link" href="/vocabulary/quiz">Choose a different set<ArrowRight size={13}/></Link></div> : null}
          <div className="form-grid"><label>Test source<select aria-label="Test source" value={source} disabled={!!selectedIds?.length} onChange={(event) => setSource(event.target.value)}>{SOURCES.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label><label>Test mode<select aria-label="Test mode" value={mode} onChange={(event) => setMode(event.target.value)}>{QUIZ_MODES.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
            <label>Number of questions<select aria-label="Number of questions" value={count} onChange={(event) => setCount(Number(event.target.value))}>{[...new Set([10,20,30,50, ...(selectedIds?.length ? [selectedIds.length] : []),500])].sort((a,b) => a-b).map((value) => <option key={value} value={value}>{value === 500 ? "All available (up to 500)" : value}</option>)}</select></label>
            {source === "date" && <label>Study date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label>}
            {source === "range" && <><label>From<input required type="date" max={to || undefined} value={from} onChange={(event) => setFrom(event.target.value)}/></label><label>To<input required type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)}/></label></>}
          </div><p className="small-note" style={{ marginTop: 16 }}>If your selected set has fewer words, the test will include all available words in that set.</p><div className="form-footer"><button className="button primary" disabled={busy} type="submit">{busy ? "Preparing your test…" : "Start test"}<ArrowRight size={16}/></button></div>
        </form>
      </> : quiz.completedAt && showResults ? <>
        <div className="panel session-setup" style={{ textAlign: "center" }}><span className="icon-box"><Sparkles size={23}/></span><h2 ref={resultHeading} tabIndex={-1}>Your test is complete.</h2><p>Your answers are saved, and your review dates have been updated.</p><div className="result-score">{quiz.score}%</div><p>{quiz.questionCount} questions · {Math.floor(quiz.durationSeconds / 60)}m {quiz.durationSeconds % 60}s active study time</p><div className="result-grid"><div><strong>{quiz.correctCount}</strong><span>Correct</span></div><div><strong>{quiz.almostCount}</strong><span>Almost correct</span></div><div><strong>{quiz.wrongCount}</strong><span>Needs another look</span></div></div><div className="hero-actions" style={{ justifyContent: "center", flexWrap: "wrap" }}>{missed.length > 0 && <button className="button primary" disabled={busy} onClick={() => start(missed.map((entry) => entry.wordId))}><RotateCcw size={15}/>{busy ? "Preparing your review…" : "Try missed words again"}</button>}<Link className="button" href="/vocabulary/quiz">Set up another test</Link><Link href="/vocabulary/history" className="button">View history</Link></div></div>
        <div className="section-heading"><h2>A closer look at your answers</h2><span className="pill">{quiz.questionCount} saved answers</span></div><div className="panel">{quiz.questions.map((entry) => {
          const response = quiz.answers.find((item) => item.questionId === entry.id);
          return response && <div className="history-row" key={entry.id}><div className="panel-heading" style={{ marginBottom: 8 }}><h3>{entry.position + 1}. {entry.prompt}</h3><span className={`pill ${response.result === "CORRECT" ? "green" : response.result === "WRONG" ? "red" : "peach"}`}>{label(response.result)}</span></div><p>Your answer: <strong>{response.userAnswer || "No answer"}</strong></p><p>Expected answer: <strong>{response.expectedAnswer}</strong></p></div>;
        })}</div>
      </> : question && <>
        <div className="session-meta"><span>{label(quiz.mode)} · {quiz.answers.length} answers saved</span><span>Question {index + 1} of {quiz.questionCount}</span></div><div className="progress-track" role="progressbar" aria-label="Test completion" aria-valuemin={0} aria-valuemax={quiz.questionCount} aria-valuenow={quiz.answers.length}><div className="progress-fill" style={{ width: `${quiz.answers.length / quiz.questionCount * 100}%` }}/></div>
        <form className="flashcard vocab-focus-card" onKeyDown={keyboard} onSubmit={(event) => { event.preventDefault(); if (!saved) void submit(); else next(); }}><span className="pill green">{instructions[question.questionType] ?? label(question.questionType)}</span><h2 ref={questionHeading} tabIndex={-1} className={`quiz-prompt${question.questionType === "BANGLA_TO_ENGLISH" ? " vocab-meaning" : ""}`} lang={question.questionType === "BANGLA_TO_ENGLISH" ? "bn" : "en"}>{question.prompt}</h2>
          {question.choices.length ? <div role="group" aria-label="Answer choices">{question.choices.map((choice, choiceIndex) => {
            const correct = saved?.expectedAnswer === choice;
            const incorrect = saved?.userAnswer === choice && saved.result === "WRONG";
            return <button type="button" className={`quiz-option${(saved?.userAnswer ?? answer) === choice ? " selected" : ""}${correct ? " correct" : ""}${incorrect ? " incorrect" : ""}`} disabled={!!saved || busy} aria-pressed={(saved?.userAnswer ?? answer) === choice} aria-keyshortcuts={String(choiceIndex + 1)} key={choice} onClick={() => setAnswer(choice)}><span className="quiz-choice-letter" aria-hidden="true">{choiceIndex + 1}</span><span lang={question.questionType === "ENGLISH_TO_BANGLA" ? "bn" : "en"}>{choice}</span>{correct ? <Check size={18} aria-label="Correct answer"/> : incorrect ? <X size={18} aria-label="Your incorrect answer"/> : null}</button>;
          })}</div> : <label>Your answer<input ref={answerInput} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Type the English word…" value={saved?.userAnswer ?? answer} onChange={(event) => setAnswer(event.target.value)} disabled={!!saved || busy}/></label>}
          {saved ? <div className={`quiz-answer-feedback ${saved.result.toLowerCase()}`} role="status"><strong>{saved.result === "CORRECT" ? "That's right." : saved.result === "ALMOST" ? "Almost — check the spelling." : "One to come back to."}</strong><p className="vocab-section-label">Correct answer</p><p className={question.questionType === "ENGLISH_TO_BANGLA" ? "vocab-meaning" : "definition"} lang={question.questionType === "ENGLISH_TO_BANGLA" ? "bn" : "en"}>{saved.expectedAnswer}</p><p className="small-note">{saved.result === "WRONG" ? "Answer saved. This word will return for review in about 10 minutes." : saved.result === "ALMOST" ? "Half a point earned. We will revisit this word tomorrow." : "Answer saved. Your next review has been moved further ahead."}</p></div> : <p className="small-note" style={{ marginTop: 15 }}><Clock3 size={13} style={{ display: "inline", marginRight: 6 }}/>Choose or type your answer, then check it. You can change it before checking.</p>}
          <div className="form-footer">{saved ? <button ref={nextButton} type="submit" className="button primary">{quiz.completedAt ? "See results" : "Next question"}<ArrowRight size={16}/></button> : <><button type="button" className="button" disabled={busy} onClick={() => { setAnswer(""); void submit(""); }}>I don’t know yet</button><button type="submit" className="button primary" disabled={busy || !answer.trim()}>{busy ? "Saving…" : "Check answer"}<Check size={16}/></button></>}</div>
          <p className="vocab-shortcuts">{hasChoices && !saved ? "Keyboard: 1–4 to select · Tab between actions · Enter to activate" : `Enter to ${saved ? quiz.completedAt ? "see results" : "continue" : "check your answer"}`}</p>
        </form><p className="small-note" style={{ textAlign: "center" }}>You can leave and return to this test. Every checked answer is saved.</p>
      </>}
    </div>
  </>;
}
