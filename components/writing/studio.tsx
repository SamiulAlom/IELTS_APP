"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, PenLine } from "lucide-react";
import type { WritingCatalog } from "@/lib/practice";
import type { WritingResources } from "@/lib/writing";
import { request, formatDate } from "@/lib/client";
import { ErrorNotice } from "@/components/ui";
import { message, PracticeLoadState } from "@/components/practice/shared";
import { WritingWorkspace } from "./workspace";
import { WritingMock } from "./mock";
import { WritingGuide, WritingNotebook, WritingPhrases, WritingSentences } from "./tools";

type Selection = { prompt: WritingCatalog[number]; attempt?: WritingCatalog[number]["attempts"][number]; key: string };
export function WritingStudio({ initialId, initialAttempt, initialDraftKey, initialTab = "library" }: { initialId?: string; initialAttempt?: string; initialDraftKey?: string; initialTab?: string }) {
  const [prompts, setPrompts] = useState<WritingCatalog | null>(null);
  const [resources, setResources] = useState<WritingResources | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [task, setTask] = useState("TASK_2"); const [type, setType] = useState(""); const [query, setQuery] = useState("");
  const [error, setError] = useState(""); const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    // A history entry may restore cached server props; read its actual draft URL on mount.
    const url = new URL(window.location.href);
    const requestedId = url.searchParams.get("id") ?? initialId;
    const requestedAttempt = url.searchParams.get("attempt") ?? initialAttempt;
    const requestedKey = url.searchParams.get("draftKey") ?? initialDraftKey;
    Promise.all([request<WritingCatalog>("/api/practice/writing"), request<WritingResources>("/api/writing")]).then(([items, tools]) => {
      if (cancelled) return;
      setPrompts(items); setResources(tools);
      const prompt = items.find(p => p.id === requestedId || p.attempts.some(a => a.id === requestedAttempt));
      if (initialTab === "library" && prompt) {
        const attempt = prompt.attempts.find(a => requestedAttempt ? a.id === requestedAttempt : requestedKey ? a.clientKey === requestedKey : false);
        if (requestedAttempt && !attempt) setError("That saved draft was not found. Choose a draft from My essays.");
        else { setSelected({ prompt, attempt, key: attempt?.clientKey ?? (/^[0-9a-f-]{36}$/i.test(requestedKey ?? "") ? requestedKey! : crypto.randomUUID()) }); setTask(prompt.taskType); }
      } else if (initialTab === "library" && (requestedId || requestedAttempt)) setError("That writing prompt or draft was not found.");
    }).catch(e => { if (!cancelled) setError(message(e)); });
    return () => { cancelled = true; };
  }, [initialId, initialAttempt, initialDraftKey, initialTab, reload]);
  const onSaved = useCallback((attempt: WritingCatalog[number]["attempts"][number]) => {
    setPrompts(current => current?.map(p => p.id === attempt.promptId ? { ...p, attempts: [attempt, ...p.attempts.filter(a => a.id !== attempt.id)] } : p) ?? null);
  }, []);
  if (!prompts || !resources) return <PracticeLoadState error={error} onRetry={() => { setError(""); setReload(r => r + 1); }}/>;
  function open(prompt: WritingCatalog[number], attempt?: WritingCatalog[number]["attempts"][number]) {
    setSelected({ prompt, attempt, key: attempt?.clientKey ?? crypto.randomUUID() });
    const url = new URL(window.location.href); url.search = ""; url.searchParams.set("id", prompt.id); if (attempt) url.searchParams.set("attempt", attempt.id); history.replaceState(history.state, "", url);
  }
  const tabs = [["library", "Prompt library"], ["essays", "My essays"], ["phrases", "Phrase bank"], ["sentences", "Sentence builder"], ["mistakes", "Mistake notebook"], ["guide", "Writing guide"], ["mock", "Timed practice"]];
  const matches = prompts.filter(p => p.taskType === task && (!type || p.type === type) && `${p.title} ${p.prompt}`.toLowerCase().includes(query.toLowerCase()));
  return <><nav className="writing-tabs" aria-label="Writing studio sections">{tabs.map(([id, title]) => <a key={id} className={initialTab === id ? "active" : ""} aria-current={initialTab === id ? "page" : undefined} href={`/writing${id === "library" ? "" : `?tab=${id}`}`}>{title}</a>)}</nav>
    {selected ? <WritingWorkspace key={selected.key} prompt={selected.prompt} attempt={selected.attempt} draftKey={selected.key} onSaved={onSaved} onClose={() => { setSelected(null); history.replaceState(history.state, "", "/writing"); }}/>
    : initialTab === "phrases" ? <WritingPhrases phrases={resources.phrases}/>
    : initialTab === "sentences" ? <WritingSentences exercises={resources.exercises}/>
    : initialTab === "mistakes" ? <WritingNotebook initial={resources.mistakes} attemptId={initialAttempt}/>
    : initialTab === "mock" ? <WritingMock/>
    : initialTab === "guide" ? <WritingGuide/>
    : initialTab === "essays" ? <section className="panel"><h2>Every saved draft</h2><p>Reopen an essay to continue writing, revisit your plan or update the self-check.</p>{prompts.flatMap(p => p.attempts.map(attempt => ({ prompt: p, attempt }))).sort((a,b) => new Date(b.attempt.updatedAt).getTime() - new Date(a.attempt.updatedAt).getTime()).map(({ prompt, attempt }) => <article className="study-row" key={attempt.id}><div className="study-row-content"><h3>{prompt.title}</h3><p>{attempt.essay.trim() ? attempt.essay.trim().split(/\s+/).length : 0} words · {formatDate(attempt.updatedAt)} · {prompt.type}</p></div><a className="button" href={`/writing?id=${prompt.id}&attempt=${attempt.id}`}>Reopen</a></article>)}{!prompts.some(p => p.attempts.length) && <p>No saved essays yet. Start a draft in the prompt library.</p>}</section>
    : <><ErrorNotice message={error}/><div className="writing-library-intro"><h2>A clear idea. A well-built answer.</h2><p>Explore {prompts.filter(p => p.taskType === "TASK_1").length} Academic reports and {prompts.filter(p => p.taskType === "TASK_2").length} essay prompts. Every task includes planning support and comparison samples.</p></div><div className="toolbar"><button aria-pressed={task === "TASK_2"} className={`button ${task === "TASK_2" ? "primary" : ""}`} onClick={() => { setTask("TASK_2"); setType(""); }}>Task 2 · Essay</button><button aria-pressed={task === "TASK_1"} className={`button ${task === "TASK_1" ? "primary" : ""}`} onClick={() => { setTask("TASK_1"); setType(""); }}>Task 1 · Academic report</button><label>Prompt type<select value={type} onChange={e => setType(e.target.value)}><option value="">All types</option>{[...new Set(prompts.filter(p => p.taskType === task).map(p => p.type))].map(t => <option key={t}>{t}</option>)}</select></label><label>Search prompts<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Topic or question…"/></label></div><div className="two-column">{matches.map(prompt => <section className="panel" key={prompt.id}><div className="panel-heading"><span className="icon-box peach"><PenLine size={20}/></span><span className="pill">{prompt.type}</span></div><h2>{prompt.title}</h2><p>{prompt.prompt}</p><button className="button primary" onClick={() => open(prompt)}>New draft<ArrowRight size={15}/></button>{prompt.attempts.length > 0 && <details style={{ marginTop: 20 }}><summary>Your saved drafts ({prompt.attempts.length})</summary>{prompt.attempts.map(attempt => <div className="study-row" key={attempt.id}><div className="study-row-content"><p>{attempt.essay.trim() ? `${attempt.essay.trim().split(/\s+/).length} words` : "Plan only"} · {formatDate(attempt.updatedAt)}</p></div><button className="button small" onClick={() => open(prompt, attempt)}>Reopen</button></div>)}</details>}</section>)}</div>{!matches.length && <p className="panel">No matching prompts. Clear the search or choose another type.</p>}</>}
  </>;
}
