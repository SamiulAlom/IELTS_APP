"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, ChevronRight, NotebookPen, RotateCcw } from "lucide-react";
import { EmptyState, ErrorNotice } from "@/components/ui";
import { formatDate, label, request } from "@/lib/client";
import type { MistakeListData } from "@/lib/mistakes";

const modules = ["VOCABULARY", "READING", "WRITING", "SPEAKING", "GRAMMAR"] as const;
const practiceLink = (module: string) => module === "VOCABULARY" ? "/vocabulary/learn?source=weak" : `/${module.toLowerCase()}`;

export function MistakeList({ data }: { data: MistakeListData }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const [refreshing, startTransition] = useTransition();
  const pageLink = (page: number) => `/mistakes?${new URLSearchParams({ module: data.filters.module, status: data.filters.status, page: String(page) })}`;

  async function toggle(id: string, resolved: boolean) {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await request(`/api/mistakes/${id}`, { resolved }, "PATCH");
      setNotice(resolved ? "Mistake marked resolved. Find it again with the Resolved filter." : "Mistake reopened. Find it in the To revisit filter.");
      startTransition(() => router.refresh());
      requestAnimationFrame(() => noticeRef.current?.focus());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this mistake.");
    } finally {
      setBusy(null);
    }
  }
  const hasSavedMistakes = data.unresolved + data.resolved > 0;
  const emptyTitle = data.total ? "No mistakes on this page" : data.filters.status === "unresolved" && data.unresolved === 0 ? "No mistakes to revisit" : "No mistakes match these filters";
  const emptyDescription = data.total ? "Choose a previous page to continue reviewing your notebook." : hasSavedMistakes ? "Your saved corrections are still in your notebook. Show all mistakes to browse them." : "Mistakes from your practice will appear here with explanations and a chance to try again.";

  return <>
    <form action="/mistakes" method="get" className="toolbar">
      <label>Practice area<select name="module" defaultValue={data.filters.module} disabled={busy !== null || refreshing}><option value="all">All areas</option>{modules.map((module) => <option key={module} value={module}>{label(module)}</option>)}</select></label>
      <label>Status<select name="status" defaultValue={data.filters.status} disabled={busy !== null || refreshing}><option value="unresolved">To revisit</option><option value="resolved">Resolved</option><option value="all">All mistakes</option></select></label>
      <button className="button" type="submit" style={{ alignSelf: "flex-end" }} disabled={busy !== null || refreshing}>Apply filters</button>
      <span className="small-note" style={{ marginLeft: "auto" }}>{data.total} {data.total === 1 ? "mistake" : "mistakes"}</span>
    </form>
    <ErrorNotice message={error} />
    <p ref={noticeRef} role="status" tabIndex={-1} className="small-note" style={{ marginBottom: notice ? 16 : 0 }}>{notice}</p>
    {data.items.length === 0 ? <EmptyState icon={<NotebookPen size={24} />} title={emptyTitle} description={emptyDescription} href={data.total ? pageLink(1) : hasSavedMistakes ? "/mistakes?status=all" : "/today"} action={data.total ? "Back to the first page" : hasSavedMistakes ? "Show all mistakes" : "Start practising"} /> : <div className="content-list">
      {data.items.map((mistake) => <article className="panel" key={mistake.id}>
        <div className="panel-heading"><div><span className={`pill ${mistake.resolved ? "green" : "peach"}`}>{label(mistake.module)}</span><h2 style={{ marginTop: 10 }}>{mistake.category}</h2></div><span className="pill">{mistake.resolved ? "Resolved" : "To revisit"}</span></div>
        <div className="two-column">
          <div><p className="eyebrow">Your original answer</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{mistake.originalContent}</p></div>
          <div><p className="eyebrow">The correction</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "var(--primary)" }}>{mistake.correction}</p></div>
        </div>
        <p className="small-note" style={{ marginTop: 18 }}>{mistake.explanation}</p>
        <p className="small-note" style={{ marginTop: 8 }}>{formatDate(mistake.createdAt, data.timezone)} · {mistake.revisionCount} {mistake.revisionCount === 1 ? "revision" : "revisions"}</p>
        <div className="history-actions" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <Link className="text-link" href={practiceLink(mistake.module)}>Practise again<ArrowRight size={14} /></Link>
          <button className={`button small ${mistake.resolved ? "" : "soft"}`} disabled={busy !== null || refreshing} onClick={() => toggle(mistake.id, !mistake.resolved)}>{mistake.resolved ? <RotateCcw size={14} /> : <Check size={14} />}{busy === mistake.id ? "Saving…" : mistake.resolved ? "Reopen" : "Mark resolved"}</button>
        </div>
      </article>)}
    </div>}
    {data.pages > 1 && <nav className="pagination" aria-label="Mistakes pages">{data.page > 1 && <Link className="button small" href={pageLink(data.page - 1)}><ChevronLeft size={14} />Previous</Link>}<span>Page {data.page} of {data.pages}</span>{data.page < data.pages && <Link className="button small" href={pageLink(data.page + 1)}>Next<ChevronRight size={14} /></Link>}</nav>}
  </>;
}
