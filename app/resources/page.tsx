import Link from "next/link";
import { ArrowRight, BookOpen, LibraryBig, Mic, NotebookPen, Search, SpellCheck, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/ui";

export default async function ResourcesPage() {
  const [words, passages, writing, speaking, grammar] = await Promise.all([prisma.vocabularyWord.count(), prisma.readingPassage.count(), prisma.writingPrompt.count(), prisma.speakingQuestion.count(), prisma.grammarTopic.count()]);
  const modules = [
    { title: "Your vocabulary bank", detail: `${words} curated English–Bangla words`, href: "/vocabulary", icon: BookOpen, color: "green" },
    { title: "Original reading passages", detail: `${passages} passages with evidence and explanations`, href: "/reading", icon: LibraryBig, color: "blue" },
    { title: "Writing prompt library", detail: `${writing} Task 1 and Task 2 prompts`, href: "/writing", icon: NotebookPen, color: "purple" },
    { title: "Speaking questions", detail: `${speaking} prompts across Parts 1, 2, and 3`, href: "/speaking", icon: Mic, color: "peach" },
    { title: "Grammar foundations", detail: `${grammar} lessons with short practice exercises`, href: "/grammar", icon: SpellCheck, color: "green" },
    { title: "Your favourite words", detail: "The words you want to keep close", href: "/vocabulary?source=favourite", icon: Star, color: "peach" },
  ];
  return <><PageTitle eyebrow="YOUR LEARNING LIBRARY" title="Good material. Meaningful practice." description="A growing collection of useful words, original passages, and focused exercises." action={<Link href="/search" className="button"><Search size={15}/>Search the library</Link>}/><div className="word-grid">{modules.map(module => <Link key={module.title} href={module.href} className="module-card"><span className={`icon-box ${module.color}`}><module.icon size={21}/></span><h3>{module.title}</h3><p>{module.detail}</p><span className="text-link">Explore <ArrowRight size={13}/></span></Link>)}</div><section className="panel" style={{ marginTop: 25 }}><h2>Make your practice work for you</h2><p className="muted" style={{ marginTop: 12 }}>Choose a small set of words, recall them without looking, and return to the ones you find difficult. Use sample answers to notice useful structures, then express your own ideas.</p><p className="small-note" style={{ marginTop: 12 }}>All built-in passages and sample answers are original teaching material. Sample responses and self-entered score estimates are for practice and are not official IELTS assessments.</p></section></>;
}
