"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WritingMockAnswers, WritingMockCatalog } from "@/lib/writing-mock";
import { request, formatDate } from "@/lib/client";
import { ErrorNotice } from "@/components/ui";
import { message, time, useUnsavedWork } from "@/components/practice/shared";
import { WritingVisual } from "./visual";
type Attempt = WritingMockCatalog["attempts"][number];
export function WritingMock() {
  const [catalog, setCatalog] = useState<WritingMockCatalog | null>(null); const [selected, setSelected] = useState<Attempt | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [reload, setReload] = useState(0);
  useEffect(() => { let active = true; request<WritingMockCatalog>("/api/writing?action=mock").then(result => { if (active) setCatalog(result); }).catch(e => { if (active) setError(message(e)); }); return () => { active = false; }; }, [reload]);
  const updated = useCallback((attempt: Attempt) => setCatalog(c => c ? { ...c, attempts: [attempt, ...c.attempts.filter(a => a.id !== attempt.id)] } : c), []);
  if (selected && catalog) return <MockEditor key={selected.id} initial={selected} serverTime={catalog.serverTime} onSaved={updated} onClose={() => setSelected(null)}/>;
  return <div className="stack"><section className="panel"><h2>Academic Writing · 60-minute practice</h2><p>Complete a Task 1 report and a Task 2 essay. Allow about 20 minutes for Task 1 and 40 for Task 2. The clock keeps running if you leave or reload.</p><p className="notice">Answers autosave. At the deadline, the latest server-saved version is finalised; late edits are not added to the timed result. You can download local text for untimed revision. Feedback is a self-review, not an official band score.</p><ErrorNotice message={error}/>{error && <button className="button" onClick={() => { setError(""); setReload(n => n + 1); }}>Retry loading mocks</button>}<button className="button primary" disabled={busy || !catalog} onClick={async () => { setBusy(true); setError(""); try { const attempt = await request<Attempt>("/api/writing?action=mock-start", {}); const fresh = await request<WritingMockCatalog>("/api/writing?action=mock"); setCatalog(fresh); setSelected(attempt); } catch (e) { setError(message(e)); } finally { setBusy(false); } }}>{catalog?.attempts.some(a => !a.completedAt) ? "Resume timed practice" : "Start timed practice"}</button></section><section className="panel"><h2>Mock history</h2>{catalog?.attempts.map(attempt => <div className="study-row" key={attempt.id}><div className="study-row-content"><h3>{attempt.completedAt ? "Completed · self-review" : "In progress"}</h3><p>{formatDate(attempt.startedAt)} · {Math.round(attempt.durationSeconds / 60)} minutes saved</p></div><button className="button" onClick={async () => { try { const fresh = await request<WritingMockCatalog>("/api/writing?action=mock"); setCatalog(fresh); setSelected(fresh.attempts.find(a => a.id === attempt.id) ?? attempt); } catch (e) { setError(message(e)); } }}>{attempt.completedAt ? "Review" : "Resume"}</button></div>)}{catalog?.attempts.length === 0 && <p>No timed writing attempts yet.</p>}</section></div>;
}
function MockEditor({ initial, serverTime, onSaved, onClose }: { initial: Attempt; serverTime: string; onSaved: (attempt: Attempt) => void; onClose: () => void }) {
  const recoveryKey = `writing-mock-recovery:${initial.id}`;
  const [recovery] = useState<WritingMockAnswers | null>(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(recoveryKey) ?? "null");
      return value && typeof value.task1 === "string" && typeof value.task2 === "string" && typeof value.revision === "number" ? value : null;
    } catch { return null; }
  });
  const [attempt, setAttempt] = useState(initial);
  const [answers, setAnswers] = useState(recovery ?? initial.answers as unknown as WritingMockAnswers);
  const [dirty, setDirty] = useState(!!recovery && !initial.completedAt); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState(recovery ? "Recovered local text. The original deadline still applies." : "Write both tasks. Changes save automatically.");
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((new Date(initial.startedAt).getTime() + 3600000 - new Date(serverTime).getTime()) / 1000)));
  const live = useRef(answers); const current = useRef(recovery ? { ...initial, answers: recovery as unknown as Attempt["answers"] } : initial); const flight = useRef<Promise<boolean> | null>(null);
  const [clockOffset] = useState(() => new Date(serverTime).getTime() - Date.now());
  useUnsavedWork(dirty || busy);
  const save = useCallback(async function persist(finish = false): Promise<boolean> {
    if (flight.current) {
      const ok = await flight.current;
      if (!ok) return false;
      const saved = current.current.answers as unknown as WritingMockAnswers;
      if (finish || live.current.task1 !== saved.task1 || live.current.task2 !== saved.task2) return persist(finish);
      return true;
    }
    const operation = async () => {
      setBusy(true); setError("");
      try {
        const snapshot = live.current;
        const result = await request<Attempt>("/api/writing?action=mock-save", { id: current.current.id, revision: (current.current.answers as unknown as WritingMockAnswers).revision, task1: snapshot.task1, task2: snapshot.task2, finish });
        current.current = result; setAttempt(result); onSaved(result);
        try {
          const saved = result.answers as unknown as WritingMockAnswers;
          if (live.current === snapshot && saved.task1 === snapshot.task1 && saved.task2 === snapshot.task2) sessionStorage.removeItem(recoveryKey);
          else sessionStorage.setItem(recoveryKey, JSON.stringify({ ...live.current, revision: saved.revision }));
        } catch { /* Saving to the database remains available. */ }
        if (live.current === snapshot) setDirty(false);
        setNotice(result.completedAt ? "Timed attempt completed. Review your saved answers below." : "Both tasks saved.");
        return true;
      } catch (e) { setError(message(e)); return false; }
      finally { flight.current = null; setBusy(false); }
    };
    flight.current = operation(); return flight.current;
  }, [onSaved, recoveryKey]);
  useEffect(() => { if (attempt.completedAt) return; const id = setInterval(() => setRemaining(Math.max(0, Math.ceil((new Date(initial.startedAt).getTime() + 3600000 - Date.now() - clockOffset) / 1000))), 500); return () => clearInterval(id); }, [attempt.completedAt, initial.startedAt, clockOffset]);
  useEffect(() => { if (remaining === 0 && !attempt.completedAt && !busy && !error) void save(true); }, [remaining, attempt.completedAt, busy, error, save]);
  useEffect(() => { if (!dirty || busy || error || attempt.completedAt) return; const id = setTimeout(() => void save(), 500); return () => clearTimeout(id); }, [dirty, busy, error, answers, attempt.completedAt, save]);
  const shown = attempt.completedAt ? attempt.answers as unknown as WritingMockAnswers : answers;
  const download = () => { const url = URL.createObjectURL(new Blob([`TASK 1\n${answers.task1}\n\nTASK 2\n${answers.task2}`], { type: "text/plain" })); const a = document.createElement("a"); a.href = url; a.download = "writing-mock-local-text.txt"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <div className="stack"><div className="toolbar"><button className="button" onClick={async () => { if (attempt.completedAt || await save()) onClose(); }}>Mock history</button><strong aria-label="Mock time remaining">{attempt.completedAt ? "Complete" : time(remaining)}</strong><button className="button" onClick={download}>Download local text</button>{!attempt.completedAt && <button className="button primary" disabled={busy} onClick={() => { if (window.confirm("Finish both tasks and lock this timed attempt for review?")) void save(true); }}>Finish timed practice</button>}</div><p className="notice" role="status">{busy ? "Saving both tasks…" : notice}</p><ErrorNotice message={error}/>{error && <button className="button" onClick={() => void save(remaining === 0)}>Retry mock save</button>}<div className="two-column">{shown.prompts.map((prompt, index) => { const key = index === 0 ? "task1" : "task2"; return <section className="panel" key={key}><p className="eyebrow">Task {index + 1} · {index === 0 ? "20" : "40"} minutes suggested</p><h2>{prompt.title}</h2><p>{prompt.prompt}</p><WritingVisual value={prompt.data}/><label>Mock Task {index + 1} answer<textarea aria-label={`Mock Task ${index + 1} answer`} rows={22} maxLength={50000} disabled={!!attempt.completedAt || remaining === 0} value={shown[key]} onChange={e => { const next = { ...answers, [key]: e.target.value }; live.current = next; setAnswers(next); setDirty(true); try { sessionStorage.setItem(recoveryKey, JSON.stringify({ ...next, revision: (current.current.answers as unknown as WritingMockAnswers).revision })); } catch { /* Unsaved-work prompts still apply. */ } }}/></label><p className="small-note">{shown[key].trim() ? shown[key].trim().split(/\s+/).length : 0} words · {index === 0 ? 150 : 250} minimum</p></section>; })}</div>{attempt.completedAt && <section className="panel"><h2>Review before your next attempt</h2><p>Check whether you answered every part, organised paragraphs clearly, supported the main points, and controlled vocabulary and grammar. Compare your timing across the two tasks.</p><a className="button" href="/writing?tab=guide">Review the writing criteria</a></section>}</div>;
}
