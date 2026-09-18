"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Save } from "lucide-react";
import type { WritingCatalog } from "@/lib/practice";
import { request } from "@/lib/client";
import { ErrorNotice } from "@/components/ui";
import { list, message, Timer, useTimer } from "@/components/practice/shared";
import { WritingVisual } from "./visual";

type Prompt = WritingCatalog[number];
type Attempt = Prompt["attempts"][number];
type Fields = { essay: string; plan: string; planFields: Record<string, string>; selfCheck: Record<string, boolean> };
type Recovery = { fields: Fields; identity: { id?: string; revision: number; clientKey: string } };
function readRecovery(key: string): Recovery | null {
  try {
    const recovered = JSON.parse(sessionStorage.getItem(key) ?? "null") as Recovery | null;
    return recovered && typeof recovered.fields?.essay === "string" && typeof recovered.fields?.plan === "string" && typeof recovered.identity?.clientKey === "string" ? recovered : null;
  } catch { return null; }
}
const objectStrings = (value: unknown): Record<string, string> => value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "string")) : {};
const objectChecks = (value: unknown): Record<string, boolean> => value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "boolean")) : {};
const task2Fields = [["thesis", "Position / thesis"], ["idea1", "Main idea 1"], ["reason1", "Reason 1"], ["explanation1", "Explanation 1"], ["example1", "Example 1"], ["idea2", "Main idea 2"], ["reason2", "Reason 2"], ["explanation2", "Explanation 2"], ["example2", "Example 2"], ["counterargument", "Counterargument (if useful)"], ["conclusion", "Conclusion"]];
const task1Fields = [["introduction", "Introduction / paraphrase"], ["overview", "Overview: main features"], ["group1", "Body 1: grouped features"], ["evidence1", "Body 1: figures or stages"], ["group2", "Body 2: grouped features"], ["evidence2", "Body 2: comparisons or locations"]];

export function WritingWorkspace({ prompt, attempt, draftKey, onSaved, onClose }: { prompt: Prompt; attempt?: Attempt; draftKey: string; onSaved: (attempt: Attempt) => void; onClose: () => void }) {
  const recoveryKey = `writing-recovery:${draftKey}`;
  const [recovery] = useState(() => readRecovery(recoveryKey));
  const [fields, setFields] = useState<Fields>(() => recovery?.fields ?? ({ essay: attempt?.essay ?? "", plan: attempt?.plan ?? "", planFields: objectStrings(attempt?.planFields), selfCheck: objectChecks(attempt?.selfCheck) }));
  const [dirty, setDirty] = useState(!!recovery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(recovery ? "Recovered unsaved text from this tab. Saving it now." : attempt ? "Saved draft reopened." : "Start writing. Changes save automatically.");
  const [sampleIndex, setSampleIndex] = useState(2);
  const [savedId, setSavedId] = useState(attempt?.id);
  const live = useRef(fields);
  const persisted = useRef<Fields | null>(recovery ? null : fields);
  const identity = useRef(recovery?.identity ?? { id: attempt?.id, revision: attempt?.revision ?? 0, clientKey: attempt?.clientKey ?? draftKey });
  const inFlight = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(true);
  const timer = useTimer();
  const seconds = useRef(attempt?.durationSeconds ?? 0);
  const { reset } = timer;
  useEffect(() => { reset(attempt?.durationSeconds ?? 0); }, [attempt?.durationSeconds, reset]);
  useEffect(() => { seconds.current = timer.seconds; }, [timer.seconds]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return inFlight.current;
    const operation = async () => {
      setBusy(true); setError("");
      try {
        do {
          const snapshot = live.current;
          identity.current.clientKey ??= crypto.randomUUID();
          const result = await request<Attempt>("/api/practice/writing", { ...snapshot, ...identity.current, promptId: prompt.id, durationSeconds: Math.min(14400, seconds.current) });
          identity.current = { id: result.id, revision: result.revision, clientKey: result.clientKey ?? identity.current.clientKey };
          persisted.current = snapshot;
          try {
            if (live.current === snapshot) sessionStorage.removeItem(recoveryKey);
            else sessionStorage.setItem(recoveryKey, JSON.stringify({ fields: live.current, identity: identity.current }));
          } catch { /* Server saving remains available without browser storage. */ }
          onSaved(result);
          if (mounted.current) {
            setSavedId(result.id);
            const url = new URL(window.location.href);
            if (url.pathname === "/writing") { url.searchParams.set("id", prompt.id); url.searchParams.set("attempt", result.id); window.history.replaceState(window.history.state, "", url); }
          }
        } while (mounted.current && live.current !== persisted.current);
        if (mounted.current) { setDirty(false); setNotice("Draft, plan and self-check saved."); }
        return true;
      } catch (reason) {
        if (mounted.current) { setError(message(reason)); setNotice("Save failed. Your text is still here; retry or download a copy."); }
        return false;
      } finally { inFlight.current = null; if (mounted.current) setBusy(false); }
    };
    inFlight.current = operation();
    return inFlight.current;
  }, [onSaved, prompt.id, recoveryKey]);
  function change(next: Fields) {
    // Write immediately: a history traversal can discard this tree before autosave fires.
    try { sessionStorage.setItem(recoveryKey, JSON.stringify({ fields: next, identity: identity.current })); } catch { /* beforeunload still protects unsaved text. */ }
    live.current = next; setFields(next); setDirty(true); setNotice("Unsaved changes — autosave shortly.");
    const url = new URL(location.href);
    if (!url.searchParams.has("draftKey")) { url.searchParams.set("id", prompt.id); url.searchParams.set("draftKey", identity.current.clientKey); history.replaceState(history.state, "", url); }
  }
  useEffect(() => { if (!dirty || busy || error) return; const timeout = setTimeout(() => void save(), 900); return () => clearTimeout(timeout); }, [dirty, busy, error, fields, save]);
  useEffect(() => {
    if (!timer.running || timer.seconds === 0 || timer.seconds % 10 !== 0 || error) return;
    if (live.current.essay.trim() || live.current.plan.trim() || Object.values(live.current.planFields).some(Boolean)) void save();
  }, [timer.running, timer.seconds, error, save]);

  useEffect(() => {
    const hasChanges = () => live.current !== persisted.current || inFlight.current !== null;
    const beforeUnload = (event: BeforeUnloadEvent) => { if (hasChanges()) { event.preventDefault(); event.returnValue = ""; } };
    const click = (event: MouseEvent) => {
      if (!hasChanges() || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, location.href);
      if (destination.pathname === location.pathname && destination.search === location.search) return;
      event.preventDefault(); event.stopImmediatePropagation();
      void save().then(ok => { if (ok) location.assign(destination.href); });
    };
    const currentUrl = location.href;
    const currentState = history.state;
    const pop = (event: PopStateEvent) => {
      if (!hasChanges()) return;
      event.stopImmediatePropagation();
      // History has moved, but the editor remains mounted until this save finishes.
      const destination = location.href;
      void save().then(ok => {
        if (ok) location.replace(destination);
        else history.pushState(currentState, "", currentUrl);
      });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", pop, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", click, true); window.removeEventListener("popstate", pop, true); };
  }, [save]);
  const plannerFields = prompt.taskType === "TASK_1" ? task1Fields : task2Fields;
  const samples = Array.isArray(prompt.samples) ? prompt.samples as { level: string; answer: string; notes: string[]; vocabulary?: string[]; grammar?: string[] }[] : [];
  const sample = samples[sampleIndex] ?? { level: "Teaching sample", answer: prompt.sampleAnswer, notes: [] };
  const wordCount = fields.essay.trim() ? fields.essay.trim().split(/\s+/).length : 0;
  function download() {
    const content = `${prompt.title}\n\n${prompt.prompt}\n\nPLAN\n${plannerFields.map(([key, title]) => `${title}: ${fields.planFields[key] ?? ""}`).join("\n")}\n${fields.plan}\n\nDRAFT\n${fields.essay}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "writing-draft.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="writing-workspace"><div className="toolbar practice-topbar"><button className="button" onClick={async () => { if ((!dirty && !busy) || await save()) { timer.pause(); onClose(); } }}><ArrowLeft size={15}/>Prompt library</button><span className="pill">{prompt.type}</span><button className="button" onClick={download}><Download size={15}/>Download draft</button><button className="button primary" disabled={busy} onClick={() => void save()}><Save size={15}/>{busy ? "Saving…" : "Save changes"}</button></div>
    <p className={`notice ${error ? "" : "success"}`} role="status">{busy ? "Saving your work…" : notice}</p><ErrorNotice message={error}/>{error && <button className="button" onClick={() => void save()}>Retry save</button>}
    <div className="writing-columns"><div className="stack"><section className="panel"><p className="eyebrow">01 · Understand</p><h2>{prompt.title}</h2><p>{prompt.prompt}</p><WritingVisual value={prompt.data}/><ul className="lesson-rules">{list(prompt.planningTips).map(tip => <li key={tip}>{tip}</li>)}</ul></section>
      <section className="panel"><p className="eyebrow">02 · Plan</p><h2>Give each paragraph a purpose</h2><div className="writing-planner">{plannerFields.map(([key, title]) => <label key={key}>{title}<textarea aria-label={title} rows={2} maxLength={5000} value={fields.planFields[key] ?? ""} onChange={event => change({ ...fields, planFields: { ...fields.planFields, [key]: event.target.value } })}/></label>)}</div><label>Your plan<textarea aria-label="Your plan" rows={3} maxLength={50000} placeholder="Additional notes or a plan from an earlier draft…" value={fields.plan} onChange={event => change({ ...fields, plan: event.target.value })}/></label><button className="button" onClick={() => {
        const body = plannerFields.map(([key]) => fields.planFields[key]?.trim()).filter(Boolean).join("\n\n");
        if (!body) { setNotice("Add some plan fields first."); return; }
        change({ ...fields, essay: [fields.essay.trim(), body].filter(Boolean).join("\n\n") }); setNotice("Plan appended to your draft. Develop these notes into connected paragraphs.");
      }}>Append plan to draft</button></section>
      <details className="panel"><summary>Compare teaching samples</summary><p className="small-note">These complete drafts isolate a revision in the second paragraph. Approximate style labels illustrate changes; they are not official scores. Write your own answer before comparing.</p><label>Sample version<select value={sampleIndex} onChange={e => setSampleIndex(Number(e.target.value))}>{samples.map((s, i) => <option key={s.level} value={i}>{s.level}</option>)}</select></label><div className="prose">{sample.answer.split(/\n\n/).map((p, i) => <p key={i}>{p}</p>)}</div><h3>What changed</h3><ul className="lesson-rules">{sample.notes.map(note => <li key={note}>{note}</li>)}</ul><h3>Language to practise</h3><p>{sample.vocabulary?.join(" · ")}</p><ul className="lesson-rules">{sample.grammar?.map(point => <li key={point}>{point}</li>)}</ul></details>
    </div><div className="stack"><section className="panel"><p className="eyebrow">03 · Write</p><div className="panel-heading"><h2>Your writing</h2><span className="pill green">{wordCount} / {prompt.taskType === "TASK_1" ? 150 : 250} minimum words</span></div><Timer timer={timer} target={prompt.taskType === "TASK_1" ? 1200 : 2400}/><label>Draft<textarea aria-label="Draft" rows={24} maxLength={50000} value={fields.essay} onChange={event => change({ ...fields, essay: event.target.value })} placeholder="Write clear, connected paragraphs…"/></label><p className="small-note">Autosave keeps your text in your local library. Keep this tab open until Saved appears.</p></section>
      <section className="panel"><p className="eyebrow">04 · Refine</p><h2>Read it once more</h2>{list(prompt.selfCheck).map((check, i) => <label className="checkbox-label" key={check}><input type="checkbox" checked={fields.selfCheck[String(i)] ?? false} onChange={event => change({ ...fields, selfCheck: { ...fields.selfCheck, [String(i)]: event.target.checked } })}/>{check}</label>)}<button className="button" disabled={busy} onClick={() => void save()}>Save self-check</button>{savedId && <p><a className="text-link" href={`/writing?tab=mistakes&attempt=${savedId}`}>Add a mistake from this draft →</a></p>}</section>
    </div></div></div>;
}
