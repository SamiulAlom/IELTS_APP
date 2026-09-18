"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Clock3, Search, Star } from "lucide-react";
import { EmptyState, ErrorNotice, Loading, PageTitle } from "@/components/ui";
import { formatDate, label, request } from "@/lib/client";
import { SOURCES, type Progress, type WordBank } from "@/types/vocabulary";

export function VocabularyBank({ review = false, timezone }: { review?: boolean; timezone: string }) {
  const params = useSearchParams();
  return <VocabularyBankContent key={params.toString()} review={review} timezone={timezone}/>;
}

function VocabularyBankContent({ review = false, timezone }: { review?: boolean; timezone: string }) {
  const params = useSearchParams();
  const [source, setSource] = useState(review ? "due" : params.get("source") || "all");
  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [date, setDate] = useState(params.get("date") || "");
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WordBank | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      if ((source === "date" && !date) || (source === "range" && (!from || !to))) { setLoading(false); setData(null); return; }
      setLoading(true);
      setError("");
      const search = new URLSearchParams({ source, q: query, category, page: String(page), limit: "18" });
      if (date) search.set("date", date);
      if (from) search.set("from", from);
      if (to) search.set("to", to);
      request<WordBank>(`/api/vocabulary?${search}`).then((result) => { if (current) setData(result); }).catch((reason: Error) => { if (current) { setError(reason.message); setData(null); } }).finally(() => { if (current) setLoading(false); });
    }, 200);
    return () => { current = false; clearTimeout(timer); };
  }, [source, query, category, page, date, from, to, revision]);

  async function favourite(id: string, value: boolean) {
    setSaving(id);
    try {
      await request<{ progress: Progress }>(`/api/vocabulary/${id}`, { isFavourite: value }, "PATCH");
      setRevision((count) => count + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your favourite."); }
    finally { setSaving(null); }
  }

  function clearFilters() {
    setQuery(""); setCategory(""); setSource(review ? "due" : "all"); setDate(""); setFrom(""); setTo(""); setPage(1); setError("");
  }
  const needsDate = (source === "date" && !date) || (source === "range" && (!from || !to));
  const filtered = !!query || !!category || source !== (review ? "due" : "all");
  const caughtUp = review && source === "due" && !loading && data?.total === 0;

  return <>
    <PageTitle eyebrow="Build useful vocabulary" title={review ? "Words ready for review" : "Your vocabulary bank"} description={review ? "Revisit words when they are due and give the difficult ones a little more practice." : "Find a word, explore its examples, or turn a saved set into a practice test."} action={<Link className="button primary" href={`/vocabulary/learn?source=${review && !caughtUp ? "due" : "new"}`}>{review && !caughtUp ? "Start a review" : "Start learning"}<ArrowRight size={16}/></Link>} />
    {review && <p className="notice"><Clock3 size={15} style={{ display: "inline", marginRight: 7 }}/>Your review dates adapt to your answers. Difficult words return sooner; familiar words get more space.</p>}
    <div className="toolbar">
      <div className="search-field"><Search size={17}/><input aria-label="Search vocabulary" placeholder="Search a word, meaning, or definition…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}/></div>
      <select aria-label="Filter vocabulary source" value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}>{SOURCES.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select>
      <select aria-label="Filter vocabulary category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{data?.categories.map((value) => <option key={value}>{value}</option>)}</select>
    </div>
    <div className="choice-row" role="group" aria-label="Quick vocabulary filters">{[["all", "All words"], ["today", "Today’s words"], ["weak", "Weak words"], ["favourite", "Favourites"]].map(([value, title]) => <button key={value} className={`button small${source === value ? " selected" : ""}`} aria-pressed={source === value} onClick={() => { setSource(value); setPage(1); }}>{title}</button>)}</div>
    {(source === "date" || source === "range") && <div className="toolbar">
      {source === "date" ? <label>Study date<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }}/></label> : <><label>From<input type="date" value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); setPage(1); }}/></label><label>To<input type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }}/></label></>}
    </div>}
    <ErrorNotice message={error}/>
    {filtered && <div className="vocab-filter-summary"><span className="small-note">{SOURCES.find(([value]) => value === source)?.[1]}{category ? ` · ${category}` : ""}{query ? ` · “${query}”` : ""}</span><button className="button small" onClick={clearFilters}>Clear filters</button></div>}
    {error ? <div className="panel"><p className="small-note">Your saved words are still safe. Try loading this set again.</p><button className="button" onClick={() => setRevision((value) => value + 1)}>Try again</button></div> : loading ? <Loading message="Opening your word bank…"/> : data?.words.length ? <>
      <div className="panel-heading"><p className="small-note" role="status">{data.total} {data.total === 1 ? "word" : "words"} · showing {(data.page - 1) * 18 + 1}–{(data.page - 1) * 18 + data.words.length}</p><Link className="text-link" href={`/vocabulary/quiz?${new URLSearchParams({ source: "all", wordIds: data.words.map((word) => word.id).join(","), count: String(data.words.length) })}`}>{data.words.length === 1 ? "Test this word" : `Test these ${data.words.length} words`} <ArrowRight size={14}/></Link></div>
      <div className="word-grid">{data.words.map((word) => <article className="word-card" key={word.id}>
        <div className="word-card-top"><div><h3>{word.word}</h3><span className="small-note">{word.partOfSpeech}{word.pronunciation ? ` · ${word.pronunciation}` : ""}</span></div><button type="button" className={`icon-button${word.progress?.isFavourite ? " active" : ""}`} aria-label={`${word.progress?.isFavourite ? "Remove" : "Save"} ${word.word} ${word.progress?.isFavourite ? "from" : "to"} favourites`} aria-pressed={word.progress?.isFavourite ?? false} disabled={saving === word.id} onClick={() => favourite(word.id, !word.progress?.isFavourite)}><Star size={16} fill={word.progress?.isFavourite ? "currentColor" : "none"}/></button></div>
        <p className="bangla vocab-meaning" lang="bn">{word.banglaMeaning}</p><p className="definition">{word.definition}</p>
        <div className="tags"><span className="pill">{word.category}</span><span className={`pill ${word.progress?.status === "DIFFICULT" ? "red" : "green"}`}>{label(word.progress?.status ?? "NEW")}</span></div>
        <details><summary>Examples & word connections</summary><p><strong>Everyday:</strong> {word.easyExample}</p><p><strong>IELTS:</strong> {word.ieltsExample}</p><p><strong>Synonyms:</strong> {word.synonyms.join(", ")}</p>{word.antonyms.length > 0 && <p><strong>Antonyms:</strong> {word.antonyms.join(", ")}</p>}{word.progress?.nextReviewAt && <p>Next review: {formatDate(word.progress.nextReviewAt, timezone)}</p>}</details>
      </article>)}</div>
      {data.pages > 1 && <div className="pagination"><button className="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={15}/>Previous</button><span>{page} / {data.pages}</span><button className="button" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight size={15}/></button></div>}
    </> : needsDate ? <EmptyState icon={<BookOpen size={25}/>} title="Choose your study dates" description="Use the date fields above to find the exact words you studied on a day or within a date range."/> : <EmptyState icon={<BookOpen size={25}/>} title={query || category ? "No words match these filters" : source === "due" ? "You're up to date." : "No words in this set yet"} description={query || category ? "Try a shorter search or clear the filters to see more words." : source === "due" ? "Your next reviews will appear here when they are ready. You can keep learning new words in the meantime." : "Start a learning session to build this collection, or choose another source."} href={query || category ? undefined : "/vocabulary/learn"} action="Start learning"/>}
  </>;
}
