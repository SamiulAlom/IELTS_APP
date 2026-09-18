"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, Pause, Play, RotateCcw } from "lucide-react";
import { ErrorNotice, Loading } from "@/components/ui";

export const list = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
export const message = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";
export const time = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsed = useRef(0);
  const startedAt = useRef(0);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      elapsed.current = Math.max(0, Math.floor((Date.now() - startedAt.current) / 1000));
      setSeconds(elapsed.current);
    }, 250);
    return () => clearInterval(timer);
  }, [running]);
  const start = useCallback(() => { startedAt.current = Date.now() - elapsed.current * 1000; setRunning(true); }, []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((value = 0, start = false) => {
    elapsed.current = value; startedAt.current = Date.now() - value * 1000; setSeconds(value); setRunning(start);
  }, []);
  return { seconds, running, toggle: () => running ? pause() : start(), pause, reset };
}

export function Timer({ timer, target, disabled = false }: { timer: ReturnType<typeof useTimer>; target?: number; disabled?: boolean }) {
  const reached = target !== undefined && timer.seconds >= target;
  return <div className={`timer-card ${reached ? "timer-complete" : ""}`}>
    <div className="timer-display"><Clock3 size={18}/><div><span className="timer" aria-label="Elapsed practice time">{time(timer.seconds)}</span><p className="small-note">Elapsed practice time</p></div></div>
    <div className="timer-meta"><span className={`pill ${reached ? "peach" : timer.running ? "green" : ""}`} aria-live="polite">{reached ? "Target time reached" : timer.running ? "Timer running" : timer.seconds ? "Paused" : "Ready when you are"}</span>{target && <span className="small-note">{reached ? "You can finish your thought." : `${time(Math.max(0, target - timer.seconds))} remaining · ${time(target)} target`}</span>}</div>
    <div className="toolbar" style={{ marginBottom: 0 }}><button type="button" disabled={disabled} className="button small" onClick={timer.toggle}>{timer.running ? <Pause size={14}/> : <Play size={14}/>}{timer.running ? "Pause" : "Start timer"}</button><button type="button" disabled={disabled || (!timer.seconds && !timer.running)} className="icon-button" onClick={() => { if (!timer.seconds || window.confirm("Reset the elapsed time for this practice?")) timer.reset(); }} aria-label="Reset timer"><RotateCcw size={14}/></button></div>
  </div>;
}

export function Options({ id, options, value, onChange, disabled = false, label = "Choose one answer" }: { id: string; options: string[]; value: string; onChange: (value: string) => void; disabled?: boolean; label?: string }) {
  return <fieldset className="answer-fieldset" disabled={disabled}><legend className="small-note">{label}</legend>{options.map((option, index) => <label className={`quiz-option ${value === option ? "selected" : ""}`} key={option} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}><input id={`${id}-option-${index}`} type="radio" name={id} value={option} checked={value === option} onChange={() => onChange(option)} style={{ width: 16 }}/><span>{option}</span>{value === option && <Check size={15} aria-hidden="true" style={{ marginLeft: "auto" }}/>}</label>)}</fieldset>;
}

export function TeachingSample({ answer }: { answer: string }) {
  return <details className="panel"><summary style={{ cursor: "pointer", fontWeight: 600 }}>Explore an original sample answer</summary><p className="small-note" style={{ marginTop: 12 }}>A teaching example, not an officially graded response. Notice how the ideas develop, then use your own language.</p><div className="prose">{answer.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></details>;
}

export function PracticeLoadState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return error ? <section className="panel"><h2>We couldn’t open your practice</h2><ErrorNotice message={error}/><button className="button primary" onClick={onRetry}>Try again</button></section> : <Loading/>;
}

export function useUnsavedWork(dirty: boolean, warning = "You have unsaved changes. Leave this page without saving them?") {
  const leaving = useRef(false);
  const confirmLeave = useCallback(() => {
    if (!dirty) return true;
    const accepted = window.confirm(warning);
    if (accepted) leaving.current = true;
    return accepted;
  }, [dirty, warning]);
  useEffect(() => {
    leaving.current = false;
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      if (!confirmLeave()) { event.preventDefault(); event.stopPropagation(); }
    };
    document.addEventListener("click", navigate, true);
    window.addEventListener("beforeunload", beforeUnload);
    return () => { document.removeEventListener("click", navigate, true); window.removeEventListener("beforeunload", beforeUnload); };
  }, [dirty, confirmLeave]);
  return confirmLeave;
}
