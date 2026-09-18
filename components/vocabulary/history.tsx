"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, History as HistoryIcon, RotateCcw } from "lucide-react";
import { EmptyState, ErrorNotice, Loading } from "@/components/ui";
import { formatDate, label, request } from "@/lib/client";
import { dateKey } from "@/lib/dates";
import { QUIZ_MODES, type History } from "@/types/vocabulary";

export function VocabularyHistory({ timezone }: { timezone: string }) {
  const [data, setData] = useState<History | null>(null);
  const [tab, setTab] = useState<"sessions" | "quizzes">("sessions");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    request<History>(`/api/vocabulary/history?page=${page}`)
      .then((result) => { if (current) setData(result); })
      .catch((caught: unknown) => { if (current) setError(caught instanceof Error ? caught.message : "Could not load your history."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, reload]);

  function changePage(next: number) {
    setLoading(true);
    setError("");
    setPage(next);
  }
  function changeTab(next: "sessions" | "quizzes") {
    setTab(next);
    if (page !== 1) changePage(1);
  }
  const total = data ? (tab === "sessions" ? data.totalSessions : data.totalQuizzes) : 0;
  const pages = Math.ceil(total / 20);

  return <>
    <div className="tabs" role="group" aria-label="Vocabulary history type">
      <button className={`tab ${tab === "sessions" ? "active" : ""}`} type="button" aria-pressed={tab === "sessions"} onClick={() => changeTab("sessions")} style={{ background: "none", borderTop: 0, borderLeft: 0, borderRight: 0 }}>Learning sessions{data ? ` (${data.totalSessions})` : ""}</button>
      <button className={`tab ${tab === "quizzes" ? "active" : ""}`} type="button" aria-pressed={tab === "quizzes"} onClick={() => changeTab("quizzes")} style={{ background: "none", borderTop: 0, borderLeft: 0, borderRight: 0 }}>Quiz attempts{data ? ` (${data.totalQuizzes})` : ""}</button>
    </div>
    <ErrorNotice message={error} />
    {error && <button className="button" onClick={() => { setError(""); setLoading(true); setReload((value) => value + 1); }}><RotateCcw size={15} />Try again</button>}
    {loading ? <Loading message="Opening your vocabulary history…" /> : data && !error && <>
      {tab === "sessions" && (data.sessions.length === 0 ? <EmptyState icon={<HistoryIcon size={24} />} title="Your first chapter starts here" description="Each learning session saves its own words, ratings, and study dates. Start one and you'll find it here." href="/vocabulary/learn" action="Learn some words" /> : <section className="panel" aria-label="Learning sessions">
        {data.sessions.map((session) => {
          const studied = session.items.filter((item) => item.studiedAt !== null);
          const studyDates = [...new Set(session.items.flatMap((item) => item.studiedAt ? [dateKey(new Date(item.studiedAt), timezone)] : []))].sort();
          const testUrl = `/vocabulary/quiz?${new URLSearchParams({ source: "all", wordIds: studied.map((item) => item.wordId).join(","), count: String(studied.length) })}`;
          return <details className="history-row" key={session.id}>
            <summary><div><h3>{formatDate(session.startedAt, timezone)} · {studied.length} of {session.items.length} words studied</h3><p>{label(session.source)} vocabulary · {session.status === "COMPLETED" ? "Session completed" : "Ready to resume"}</p></div><span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}><span className={`pill ${session.status === "COMPLETED" ? "green" : "peach"}`}>{session.status === "COMPLETED" ? "Completed" : "In progress"}</span><span className="text-link">View words<ChevronDown size={13} /></span></span></summary>
            <div className="history-words">{session.items.map((item) => <span key={item.id} className={`pill ${item.rating === "DIFFICULT" ? "red" : item.rating === "KNOWN" ? "green" : ""}`} title={item.studiedAt ? `Studied ${formatDate(item.studiedAt, timezone)} · ${label(item.rating ?? "")}` : "Not studied yet"}>{item.word.word}<span className="muted">· {item.rating ? label(item.rating) : "Not yet"}{item.studiedAt ? ` · ${formatDate(item.studiedAt, timezone)}` : ""}</span></span>)}</div>
            {session.completedAt && <p className="small-note" style={{ marginTop: 12 }}>Completed {formatDate(session.completedAt, timezone)}. The words above belong to this saved session.</p>}
            <div className="history-actions" style={{ flexWrap: "wrap" }}>
              {session.status === "ACTIVE" && <Link className="button small primary" href={`/vocabulary/learn?session=${encodeURIComponent(session.id)}`}>Resume session<ArrowRight size={14} /></Link>}
              {studied.length > 0 && <Link className="button small soft" href={testUrl}>Test these {studied.length} words<ArrowRight size={14} /></Link>}
              {studyDates.map((date) => <Link key={date} className="text-link" href={`/vocabulary?${new URLSearchParams({ source: "date", date })}`}>Browse {formatDate(`${date}T12:00:00Z`, "UTC")}<ArrowRight size={13} /></Link>)}
            </div>
          </details>;
        })}
      </section>)}
      {tab === "quizzes" && (data.quizzes.length === 0 ? <EmptyState icon={<HistoryIcon size={24} />} title="A place for your practice results" description="Test your learned vocabulary to see what is sticking and what needs another look." href="/vocabulary/quiz" action="Take a vocabulary quiz" /> : <section className="panel" aria-label="Quiz attempts">
        {data.quizzes.map((quiz) => <article className="history-row" key={quiz.id}>
          <div className="panel-heading" style={{ marginBottom: 8 }}><div><h3>{QUIZ_MODES.find(([mode]) => mode === quiz.quiz.mode)?.[1] ?? label(quiz.quiz.mode)}</h3><p>{formatDate(quiz.startedAt, timezone)} · {label(quiz.quiz.source)} · {quiz.questionCount} questions</p></div><span className={`pill ${quiz.completedAt ? "green" : "peach"}`}>{quiz.completedAt ? `${quiz.score}%` : "In progress"}</span></div>
          <p className="small-note">{quiz.correctCount} correct · {quiz.almostCount} almost · {quiz.wrongCount} wrong · {Math.floor(quiz.durationSeconds / 60)}m {quiz.durationSeconds % 60}s</p>
          <div className="history-actions"><Link className="text-link" href={`/vocabulary/quiz?attempt=${encodeURIComponent(quiz.id)}`}>{quiz.completedAt ? "Review answers" : "Resume quiz"}<ArrowRight size={14} /></Link></div>
        </article>)}
      </section>)}
      {pages > 1 && <nav className="pagination" aria-label="Vocabulary history pages"><button className="button small" disabled={page <= 1} onClick={() => changePage(page - 1)}><ChevronLeft size={14} />Previous</button><span>Page {page} of {pages}</span><button className="button small" disabled={page >= pages} onClick={() => changePage(page + 1)}>Next<ChevronRight size={14} /></button></nav>}
    </>}
  </>;
}
