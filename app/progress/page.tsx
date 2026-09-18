import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCheck, Clock3, Flame, GraduationCap, Mic, PenLine, Target } from "lucide-react";
import { ActivityChart } from "@/components/activity-chart";
import { PageTitle, StatCard } from "@/components/ui";
import { getDashboard } from "@/lib/dashboard";
import { formatDate } from "@/lib/client";

export const metadata: Metadata = { title: "Your progress" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const data = await getDashboard();
  const skills = [
    { label: "Reading", value: data.stats.readingAccuracy === null ? "—" : `${data.stats.readingAccuracy}%`, detail: `${data.stats.readingCompleted} completed passages · answer accuracy`, href: "/reading", icon: BookOpen },
    { label: "Writing", value: data.stats.writingCompleted, detail: "Saved writing practices with essay text", href: "/writing", icon: PenLine },
    { label: "Speaking", value: data.stats.speakingCompleted, detail: "Saved speaking practice attempts", href: "/speaking", icon: Mic },
    { label: "Grammar", value: data.stats.grammarCompleted, detail: "Completed grammar exercises", href: "/grammar", icon: GraduationCap },
  ];
  const estimates = [
    ["Listening", data.settings.estimatedListening], ["Reading", data.settings.estimatedReading],
    ["Writing", data.settings.estimatedWriting], ["Speaking", data.settings.estimatedSpeaking],
  ] as const;
  return <>
    <PageTitle eyebrow="See how far you've come" title="Your progress" description="Your saved practice tells the story. Every new session adds to it." action={<Link className="button" href="/today">Continue today&apos;s plan<ArrowRight size={15} /></Link>} />
    <div className="stats-grid">
      <StatCard label="Words learned" value={data.vocabulary.learned} detail={`${data.vocabulary.total} words in your bank`} icon={<BookOpen size={17} />} />
      <StatCard label="Words mastered" value={data.vocabulary.mastered} detail={`${data.vocabulary.weak} words need more practice`} icon={<CheckCheck size={17} />} color="blue" />
      <StatCard label="Study this week" value={`${data.stats.weeklyMinutes} min`} detail="Recorded over the last 7 days" icon={<Clock3 size={17} />} color="purple" />
      <StatCard label="Current streak" value={`${data.streak.current} days`} detail={`Longest: ${data.streak.longest} days · ${data.streak.daysStudied} days studied`} icon={<Flame size={17} />} color="peach" />
    </div>
    <div className="dashboard-grid">
      <div className="stack">
        <section className="panel"><div className="panel-heading"><div><h2>Your last 7 days</h2><p>Study minutes · {data.week.reduce((sum, day) => sum + day.wordsLearned, 0)} new words learned this week</p></div><span className="pill">Last 7 days</span></div><ActivityChart data={data.week} />{!data.stats.weeklyMinutes && !data.week.some((day) => day.wordsLearned) && <p className="small-note" style={{ marginTop: 14 }}>Your chart will fill in when you start practising.</p>}<details style={{ marginTop: 18 }}><summary className="text-link" style={{ cursor: "pointer" }}>View daily totals</summary><div className="table-wrap"><table><caption className="small-note" style={{ textAlign: "left", marginTop: 12 }}>The same seven days, with exact study totals.</caption><thead><tr><th scope="col">Date</th><th scope="col">Minutes</th><th scope="col">New words</th></tr></thead><tbody>{data.week.map((day) => <tr key={day.date}><th scope="row">{formatDate(`${day.date}T12:00:00Z`, "UTC")}</th><td>{day.minutes}</td><td>{day.wordsLearned}</td></tr>)}</tbody></table></div></details></section>
        <section className="panel"><div className="panel-heading"><h2>Practice across your skills</h2></div>{skills.map((skill) => <Link href={skill.href} className="study-row" key={skill.label}><span className="icon-box"><skill.icon size={18} /></span><span className="study-row-content"><h3>{skill.label}</h3><p>{skill.detail}</p></span><strong style={{ fontSize: 20 }}>{skill.value}</strong><ArrowRight size={15} /></Link>)}</section>
      </div>
      <div className="stack">
        <section className="panel"><div className="panel-heading"><h2>Your band target</h2><Target size={18} className="muted" /></div><p style={{ fontSize: 36, fontWeight: 650 }}>{data.settings.targetBand.toFixed(1)}</p><p className="small-note">Your overall estimate: {data.estimatedOverall === null ? "not set yet" : data.estimatedOverall.toFixed(1)}</p>{estimates.map(([label, score]) => <div className="skill-score" key={label}><span>{label}</span><b>{score === null ? "Not set" : score.toFixed(1)}</b></div>)}<p className="target-footnote">Personal estimates from your profile. Practice results are not official IELTS scores.</p><Link className="text-link" href="/settings" style={{ marginTop: 15 }}>Update my estimates<ArrowRight size={14} /></Link></section>
        <section className="panel"><div className="panel-heading"><h2>Learn from your mistakes</h2><CheckCheck size={18} className="muted" /></div><p style={{ fontSize: 30, fontWeight: 650 }}>{data.stats.mistakesResolved}</p><p className="small-note">Mistakes marked resolved · {data.stats.mistakesUnresolved} still to revisit</p><Link className="button soft" href="/mistakes" style={{ marginTop: 18 }}>Open my notebook<ArrowRight size={14} /></Link></section>
      </div>
    </div>
  </>;
}
