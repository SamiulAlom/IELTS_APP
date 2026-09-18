import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { EmptyState, PageTitle } from "@/components/ui";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().slice(0, 100) ?? "";
  const results: { title: string; description: string; href: string; module: string }[] = [];
  if (query) {
    const [words, reading, writing, speaking, grammar] = await Promise.all([
      prisma.vocabularyWord.findMany({ where: { OR: [{ word: { contains: query } }, { banglaMeaning: { contains: query } }, { definition: { contains: query } }] }, take: 12 }),
      prisma.readingPassage.findMany({ where: { isFullMockPassage: false, OR: [{ title: { contains: query } }, { topic: { contains: query } }] }, take: 8 }),
      prisma.writingPrompt.findMany({ where: { OR: [{ title: { contains: query } }, { prompt: { contains: query } }] }, take: 8 }),
      prisma.speakingQuestion.findMany({ where: { question: { contains: query } }, include: { topic: true }, take: 8 }),
      prisma.grammarTopic.findMany({ where: { OR: [{ title: { contains: query } }, { lesson: { contains: query } }] }, take: 8 }),
    ]);
    results.push(...words.map(item => ({ title: item.word, description: item.banglaMeaning, href: `/vocabulary?q=${encodeURIComponent(item.word)}`, module: "Vocabulary" })), ...reading.map(item => ({ title: item.title, description: item.topic, href: `/reading?id=${item.id}`, module: "Reading" })), ...writing.map(item => ({ title: item.title, description: item.taskType.replace("_", " "), href: `/writing?id=${item.id}`, module: "Writing" })), ...speaking.map(item => ({ title: item.question, description: `${item.topic.name} · Part ${item.part}`, href: `/speaking?id=${item.id}`, module: "Speaking" })), ...grammar.map(item => ({ title: item.title, description: "Lesson and practice exercises", href: `/grammar?id=${item.id}`, module: "Grammar" })));
  }
  return <><PageTitle eyebrow="FOLLOW YOUR CURIOSITY" title="Find your next learning moment." description="Search words in English or Bangla, speaking questions, writing prompts, and lessons."/><form className="toolbar" action="/search"><label className="search-field"><span className="sr-only">Search library</span><Search size={17}/><input name="q" defaultValue={query} placeholder="Try ‘education’, ‘significant’, or a Bangla meaning" maxLength={100}/></label><button className="button primary" type="submit">Search</button></form>{query ? results.length ? <><p className="small-note">{results.length} results for “{query}”</p><div className="search-results">{results.map(result => <Link key={result.href} className="search-result" href={result.href}><div><span className="pill green" style={{ marginBottom: 7 }}>{result.module}</span><h3>{result.title}</h3><p>{result.description}</p></div><ArrowUpRight size={16}/></Link>)}</div></> : <EmptyState icon={<Search/>} title="No matches yet" description="Try a shorter keyword or explore the learning library." href="/resources" action="Explore resources"/> : <EmptyState icon={<Search/>} title="A word, a topic, a new idea." description="Type something above to search your learning library."/>}</>;
}
