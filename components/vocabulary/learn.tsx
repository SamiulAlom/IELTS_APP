"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Flag, RotateCcw, Sparkles, Star } from "lucide-react";
import { ErrorNotice, Loading, PageTitle } from "@/components/ui";
import { label, request } from "@/lib/client";
import type { Progress, Session } from "@/types/vocabulary";
import { useStudyTime } from "./use-study-time";

const sources = [["new", "New words"], ["due", "Words due for review"], ["weak", "Weak words"], ["learned", "All learned words"], ["all", "The full vocabulary bank"]];

export function VocabularyLearn({ defaultSize }: { defaultSize: number }) {
  const params = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [size, setSize] = useState(Number(params.get("size")) || defaultSize);
  const [source, setSource] = useState(sources.some(([value]) => value === params.get("source")) ? params.get("source")! : "new");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [resumed, setResumed] = useState(false);
  const saving = useRef(false);
  const loadedSessionId = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const studyTime = useStudyTime(`${session?.id ?? "setup"}-${index}`);
  const item = session?.items[index];
  const completed = session?.items.filter((entry) => entry.studiedAt).length ?? 0;

  useEffect(() => {
    let mounted = true;
    const id = params.get("session");
    if (id && loadedSessionId.current === id) return;
    request<{ session: Session | null }>(id ? `/api/vocabulary/sessions/${id}` : "/api/vocabulary/sessions").then((result) => {
      if (!mounted) return;
      loadedSessionId.current = result.session?.id ?? null;
      setSession(result.session);
      setIndex(Math.max(0, result.session?.items.findIndex((entry) => !entry.studiedAt) ?? 0));
      setShowSummary(result.session?.status === "COMPLETED");
      setResumed(result.session?.status === "ACTIVE");
    }).catch((reason: Error) => { if (mounted) setError(reason.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [params]);

  useEffect(() => {
    if (loading) return;
    if (showSummary) summaryHeading.current?.focus({ preventScroll: true });
    else heading.current?.focus({ preventScroll: true });
  }, [loading, index, session?.id, showSummary]);

  async function start() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const result = await request<{ session: Session }>("/api/vocabulary/sessions", { size, source });
      loadedSessionId.current = result.session.id;
      setSession(result.session);
      setIndex(Math.max(0, result.session.items.findIndex((entry) => !entry.studiedAt)));
      setReview(false); setShowSummary(false); setResumed(false);
      const url = new URL(window.location.href);
      url.searchParams.set("session", result.session.id);
      window.history.replaceState(null, "", url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not start your session."); }
    finally { saving.current = false; setBusy(false); }
  }

  async function rate(rating: "KNOWN" | "LEARNING" | "DIFFICULT") {
    if (!session || !item || item.studiedAt || saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const result = await request<{ session: Session }>(`/api/vocabulary/sessions/${session.id}`, { wordId: item.wordId, rating, timeSpentMs: studyTime() }, "PATCH");
      setSession(result.session); setResumed(false);
      requestAnimationFrame(() => continueButton.current?.focus());
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save this word. Your card is still here; try again."); }
    finally { saving.current = false; setBusy(false); }
  }

  async function favourite() {
    if (!session || !item || saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const result = await request<{ progress: Progress }>(`/api/vocabulary/${item.wordId}`, { isFavourite: !item.word.progress?.isFavourite }, "PATCH");
      setSession({ ...session, items: session.items.map((entry) => entry.id === item.id ? { ...entry, word: { ...entry.word, progress: result.progress } } : entry) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your favourite."); }
    finally { saving.current = false; setBusy(false); }
  }

  function next() {
    if (!session || busy) return;
    if (session.status === "COMPLETED" && !review) { setShowSummary(true); return; }
    if (review) { if (index < session.items.length - 1) setIndex(index + 1); else { setReview(false); setShowSummary(true); } return; }
    const nextUnstudied = session.items.findIndex((entry, position) => position > index && !entry.studiedAt);
    const firstUnstudied = session.items.findIndex((entry) => !entry.studiedAt);
    if (nextUnstudied >= 0) setIndex(nextUnstudied);
    else if (firstUnstudied >= 0 && firstUnstudied !== index) setIndex(firstUnstudied);
  }

  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || busy) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea, [contenteditable=true]")) return;
    if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); setIndex(index - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); next(); }
    if (["1", "2", "3"].includes(event.key) && !item?.studiedAt && !review) {
      event.preventDefault(); void rate((["KNOWN", "LEARNING", "DIFFICULT"] as const)[Number(event.key) - 1]);
    }
    if (event.key === "Enter" && item?.studiedAt && !target.closest("button, a")) { event.preventDefault(); next(); }
  }

  if (loading) return <Loading message="Getting your learning session ready…"/>;
  const remaining = session ? session.items.length - completed : 0;
  const canSkip = !!item?.studiedAt || remaining > 1 || review;

  return <>
    <PageTitle eyebrow="Build your vocabulary" title="Your vocabulary session" description="Read the meaning and examples, then choose how familiar the word feels."/>
    <div className="practice-container">
      <ErrorNotice message={error}/>
      {!session ? <form className="panel session-setup" onSubmit={(event) => { event.preventDefault(); void start(); }}>
        <span className="icon-box"><BookOpen size={21}/></span><h2>Choose a set that fits your day.</h2>
        <p>Your progress is saved after every word. An unfinished session stays ready for your return.</p>
        <label>Words to practise<select aria-label="Words to practise" value={source} onChange={(event) => setSource(event.target.value)}>{sources.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
        <div className="choice-row" role="group" aria-label="Session size">{[10,20,25,30].map((value) => <button type="button" key={value} aria-pressed={size === value} className={`button${size === value ? " selected" : ""}`} onClick={() => setSize(value)}>{value} words</button>)}</div>
        <label>Custom number of words<input type="number" min={1} max={100} aria-describedby="session-size-help" value={size || ""} onChange={(event) => setSize(Number(event.target.value))}/></label>
        <p id="session-size-help" className="small-note">Choose 1–100 words. If fewer are available, we will use the available set.</p>
        <div className="form-footer"><button className="button primary" disabled={busy || size < 1 || size > 100 || !Number.isInteger(size)} type="submit">{busy ? "Preparing your words…" : "Start learning"}<ArrowRight size={16}/></button></div>
      </form> : showSummary && !review ? <div className="panel session-setup" style={{ textAlign: "center" }}>
        <span className="icon-box"><Sparkles size={22}/></span><h2 ref={summaryHeading} tabIndex={-1}>{completed} words. A little more confident.</h2><p>Session complete and saved. Test this exact set to see which words you remember.</p>
        <div className="result-grid"><div><strong>{session.items.filter((entry) => entry.rating === "KNOWN").length}</strong><span>Know it</span></div><div><strong>{session.items.filter((entry) => entry.rating === "LEARNING").length}</strong><span>Learning</span></div><div><strong>{session.items.filter((entry) => entry.rating === "DIFFICULT").length}</strong><span>Difficult</span></div></div>
        <div className="hero-actions" style={{ justifyContent: "center", flexWrap: "wrap" }}><Link className="button primary" href={`/vocabulary/quiz?source=all&wordIds=${session.items.map((entry) => entry.wordId).join(",")}`}>Test these words<ArrowRight size={15}/></Link><button className="button" onClick={() => { setReview(true); setShowSummary(false); setIndex(0); }}><RotateCcw size={15}/>Read through again</button><Link href="/vocabulary/history" className="button">View saved session<Check size={15}/></Link></div>
        <Link className="text-link" style={{ marginTop: 24 }} href="/vocabulary/learn">Start another set<ArrowRight size={14}/></Link>
      </div> : item && <section aria-label="Vocabulary practice card" onKeyDown={keyboard}>
        {resumed && completed > 0 && <div className="session-resume"><div><strong>Welcome back. Your place is saved.</strong><p>{completed} words studied · {remaining} still to go in this {session.source === "new" ? "new-word" : label(session.source).toLowerCase()} session.</p></div><Link className="text-link" href="/vocabulary/history">View history<ArrowRight size={14}/></Link></div>}
        <div className="session-meta"><span>{review ? "Reading through your saved set" : `${completed} of ${session.items.length} words saved`}</span><span>Word {index + 1} of {session.items.length}</span></div>
        <div className="progress-track" role="progressbar" aria-label="Session completion" aria-valuemin={0} aria-valuemax={session.items.length} aria-valuenow={completed}><div className="progress-fill" style={{ width: `${completed / session.items.length * 100}%` }}/></div>
        <article className="flashcard vocab-focus-card" aria-labelledby="vocabulary-word">
          <div className="flashcard-heading"><span className="pill green">{item.word.category}</span><button className={`icon-button${item.word.progress?.isFavourite ? " active" : ""}`} aria-label={`${item.word.progress?.isFavourite ? "Remove from" : "Add to"} favourites`} aria-pressed={item.word.progress?.isFavourite ?? false} onClick={favourite} disabled={busy}><Star size={17} fill={item.word.progress?.isFavourite ? "currentColor" : "none"}/></button></div>
          <h2 className="vocab-word-heading" id="vocabulary-word" ref={heading} tabIndex={-1}>{item.word.word}</h2>
          <p className="small-note">{item.word.partOfSpeech}{item.word.pronunciation ? ` · ${item.word.pronunciation}` : ""}</p>
          <p className="bangla vocab-meaning" lang="bn">{item.word.banglaMeaning}</p>
          <p className="definition">{item.word.definition}</p>
          <div className="vocab-word-connections"><div className="vocab-connection"><span className="vocab-section-label">Similar words</span><p>{item.word.synonyms.join(" · ")}</p></div>{item.word.antonyms.length > 0 && <div className="vocab-connection"><span className="vocab-section-label">Opposite meaning</span><p>{item.word.antonyms.join(" · ")}</p></div>}</div>
          <div className="vocab-example-grid"><div className="example-block"><small>Everyday example</small>{item.word.easyExample}</div><div className="example-block"><small>IELTS example</small>{item.word.ieltsExample}</div></div>
        </article>
        {item.studiedAt ? <div className="notice success vocab-save-status" role="status"><Check size={19}/><div><strong>{item.word.word} saved as {label(item.rating ?? "LEARNING").toLowerCase()}.</strong><p>{session.status === "COMPLETED" ? "All words in this session are saved. Your summary is ready." : "Continue when you are ready. You can revisit this card with Previous."}</p></div></div> : <>
          <p className="vocab-section-label" style={{ marginBottom: 10 }}>How familiar does this word feel?</p>
          <div className="rating-buttons">
            <button className="button soft vocab-rating-option" aria-label="Know it" aria-keyshortcuts="1" onClick={() => rate("KNOWN")} disabled={busy}><Check size={18}/><span><strong>Know it</strong><small>I can use this word</small></span><kbd>1</kbd></button>
            <button className="button primary vocab-rating-option" aria-label="Learning" aria-keyshortcuts="2" onClick={() => rate("LEARNING")} disabled={busy}><BookOpen size={18}/><span><strong>Learning</strong><small>I need another look</small></span><kbd>2</kbd></button>
            <button className="button danger vocab-rating-option" aria-label="Difficult" aria-keyshortcuts="3" onClick={() => rate("DIFFICULT")} disabled={busy}><Flag size={18}/><span><strong>Difficult</strong><small>Review this soon</small></span><kbd>3</kbd></button>
          </div>
        </>}
        <div className="practice-nav"><button className="button" disabled={index === 0 || busy} onClick={() => setIndex(index - 1)}><ChevronLeft size={16}/>Previous</button><span role="status">{busy ? "Saving your word…" : item.studiedAt ? "Saved to your history" : "Choose a rating to save this word"}</span><button ref={continueButton} className={`button${item.studiedAt ? " primary" : ""}`} disabled={busy || !canSkip} onClick={next}>{session.status === "COMPLETED" && !review ? "See session summary" : review && index === session.items.length - 1 ? "Back to summary" : item.studiedAt ? "Continue" : "Skip for now"}<ChevronRight size={16}/></button></div>
        <p className="vocab-shortcuts">Keyboard: 1 / 2 / 3 to save a rating · Enter to continue · ← / → to move between words</p>
        {!item.studiedAt && <p className="small-note" style={{ textAlign: "center" }}>Skipping leaves the word unstudied so you can return to it before finishing.</p>}
      </section>}
    </div>
  </>;
}
