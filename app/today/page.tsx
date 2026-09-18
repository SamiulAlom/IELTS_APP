import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock3, Headphones, Languages, Mic, PenLine, Repeat2 } from "lucide-react";
import { PageTitle } from "@/components/ui";
import { getDashboard } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Today's plan" };
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const data = await getDashboard();
  const { settings } = data;
  const completedModules = new Set(data.today.modulesPractised);
  const weakSkill = [
    { name: "Reading", band: settings.estimatedReading, href: "/reading" },
    { name: "Writing", band: settings.estimatedWriting, href: "/writing" },
    { name: "Speaking", band: settings.estimatedSpeaking, href: "/speaking" },
  ].filter((skill) => skill.band !== null && skill.band < settings.targetBand).sort((left, right) => (left.band ?? 9) - (right.band ?? 9))[0];
  const targetWords = Math.min(Math.max(0, settings.vocabularySessionSize - data.vocabulary.todayLearned), Math.max(0, data.vocabulary.total - data.vocabulary.learned));
  const vocabularySource = targetWords > 0 ? "new" : data.vocabulary.due > 0 ? "due" : "learned";
  const vocabularyHref = data.vocabulary.total > 0 ? `/vocabulary/learn?size=${targetWords || settings.vocabularySessionSize}&source=${vocabularySource}` : "/vocabulary";
  const hasPracticeEstimates = [settings.estimatedReading, settings.estimatedWriting, settings.estimatedSpeaking].every((score) => score !== null);
  const tasks = [
    { module: "VOCABULARY", title: targetWords > 0 ? `Learn ${targetWords} new words` : data.vocabulary.todayLearned >= settings.vocabularySessionSize ? "Daily vocabulary target reached" : "Revisit your learned vocabulary", description: `${data.vocabulary.todayLearned} / ${settings.vocabularySessionSize} new words learned today · ${data.vocabulary.due} reviews due now`, icon: Languages, href: vocabularyHref, share: 0.25 },
    { module: "READING", title: "Read with a question in mind", description: "Try a passage and use the explanations to review your answers.", icon: BookOpen, href: "/reading", share: 0.25 },
    { module: "SPEAKING", title: "Say your ideas out loud", description: "Choose a speaking prompt, answer, then reflect on the sample.", icon: Mic, href: "/speaking", share: 0.15 },
    { module: "WRITING", title: "Plan, write, and refine", description: "Work on one writing task. A thoughtful paragraph is a useful start.", icon: PenLine, href: "/writing", share: 0.25 },
    { module: "GRAMMAR", title: "Give accuracy a little attention", description: "Practise one grammar topic and review the explanation.", icon: Languages, href: "/grammar", share: 0.1 },
  ];
  const progress = Math.min(100, data.today.minutes / settings.dailyStudyMinutes * 100);

  return <>
    <PageTitle eyebrow="A little progress, every day" title="Today's study plan" description={`Your ${settings.dailyStudyMinutes}-minute routine. Start with one activity and build from there.`} action={<Link className="button" href="/settings">Adjust my routine</Link>} />
    <div className="dashboard-grid">
      <div className="panel">
        <div className="panel-heading"><div><h2>Your practice checklist</h2><p>Completion updates from your saved practice.</p></div><span className="pill green">{tasks.filter((task) => completedModules.has(task.module)).length} / {tasks.length} practised</span></div>
        {tasks.map((task, index) => <Link className="study-row" href={task.href} key={task.module}>
          <span className="plan-number">{completedModules.has(task.module) ? <Check size={16} /> : index + 1}</span>
          <span className="study-row-content"><h3>{task.title}</h3><p>{task.description}</p>{completedModules.has(task.module) && <span className="pill green" style={{ marginTop: 7 }}>Practised today</span>}</span>
          <span className="study-duration">~{Math.max(1, Math.round(settings.dailyStudyMinutes * task.share))} min</span>
          <span className="round-arrow"><ArrowRight size={14} /></span>
        </Link>)}
        <div className="daily-footer"><Clock3 size={14} />The suggested times are flexible. Your recorded study time appears as you practise.</div>
      </div>
      <div className="stack">
        <section className="panel">
          <div className="panel-heading"><h2>Time for yourself</h2><Clock3 size={18} className="muted" /></div>
          <p style={{ fontSize: 32, fontWeight: 650 }}>{data.today.minutes} <span className="muted" style={{ fontSize: 14 }}>/ {settings.dailyStudyMinutes} min</span></p>
          <div className="progress-track" style={{ marginTop: 18 }} role="progressbar" aria-label="Daily study target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-valuetext={`${data.today.minutes} of ${settings.dailyStudyMinutes} minutes studied`}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <p className="small-note" style={{ marginTop: 12 }}>{data.streak.current ? `${data.streak.current} days in your current streak. Keep finding time for practice.` : "Your next study session is a fresh start."}</p>
        </section>
        <section className="panel">
          <div className="panel-heading"><h2>Make it stick</h2><Repeat2 size={18} className="muted" /></div>
          <p className="small-note">{data.vocabulary.due} vocabulary reviews are due, and {data.stats.mistakesUnresolved} saved mistakes are ready to revisit.</p>
          <div className="choice-row" style={{ marginBottom: 0 }}>{data.vocabulary.due > 0 ? <Link className="button soft" href="/vocabulary/learn?source=due">Review {data.vocabulary.due} due words</Link> : <span className="pill green"><Check size={13} />No vocabulary reviews due</span>}<Link className="text-link" href="/mistakes">Open mistake notebook <ArrowRight size={14} /></Link></div>
        </section>
        <section className="panel">
          <div className="panel-heading"><h2>A useful focus</h2><Headphones size={18} className="muted" /></div>
          <p className="small-note">{weakSkill ? `Your ${weakSkill.name.toLowerCase()} estimate is ${weakSkill.band?.toFixed(1)} against your ${settings.targetBand.toFixed(1)} target. Give this skill a little extra attention today.` : hasPracticeEstimates ? "Your reading, writing, and speaking estimates meet your target. Keep practising across these skills and use your saved mistakes to choose a focus." : "Add your current estimates in Settings to choose a skill to focus on. Until then, explore the practice areas and find what needs attention."}</p>
          <Link className="text-link" href={weakSkill?.href ?? (hasPracticeEstimates ? "/progress" : "/settings")} style={{ marginTop: 15 }}>{weakSkill ? `Practise ${weakSkill.name.toLowerCase()}` : hasPracticeEstimates ? "View my progress" : "Set my estimates"}<ArrowRight size={14} /></Link>
        </section>
      </div>
    </div>
  </>;
}
