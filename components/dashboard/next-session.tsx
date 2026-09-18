import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, ClipboardCheck, RotateCcw } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import { HeroArt } from "./hero-art";

export function NextSession({ data }: { data: DashboardData }) {
  const active = data.recentSessions.find(session => session.status === "ACTIVE");
  const hasReviews = data.vocabulary.due > 0;
  const href = active ? `/vocabulary/learn?session=${active.id}` : hasReviews ? "/vocabulary/learn?source=due" : `/vocabulary/learn?size=${data.settings.vocabularySessionSize}`;
  return <>
    <section className="hero dashboard-hero">
      <div className="hero-copy"><p className="eyebrow">{active ? "YOUR PROGRESS IS RIGHT HERE" : hasReviews ? "A GOOD TIME TO REVISIT" : "YOUR NEXT FOCUSED SESSION"}</p>
        <h2>{active ? <>A little further.<br/>Right where you left off.</> : hasReviews ? <>Bring those words<br/>back to mind.</> : <>Small steps today.<br/>More confidence tomorrow.</>}</h2>
        <p className="hero-description">{active ? `${active.studiedCount} of ${active.totalCount} words saved. Pick up your session whenever you're ready.` : hasReviews ? `${data.vocabulary.due} words are ready for another look. A short review now helps them stay with you.` : `Make a little room for your goal. Start with ${data.settings.vocabularySessionSize} useful words, then build from there.`}</p>
        <div className="hero-actions"><Link href={href} className="button primary">{active ? "Continue my session" : hasReviews ? "Start my review" : "Start learning"}<ArrowRight size={16}/></Link><Link href="/today" className="text-link">My daily plan <ArrowUpRight size={14}/></Link></div>
      </div><HeroArt/>
    </section>
    <div className="quick-starts" aria-label="Quick start practice">
      <span className="quick-start-label">Your pace.<br/><strong>Your next step.</strong></span>
      <Link href="/vocabulary/learn?size=20"><BookOpen size={17}/><span>Learn 20 words</span><ArrowUpRight size={13}/></Link>
      <Link href="/vocabulary/learn?size=30"><BookOpen size={17}/><span>Learn 30 words</span><ArrowUpRight size={13}/></Link>
      <Link href={data.vocabulary.weak ? "/vocabulary/learn?source=weak" : "/vocabulary/review"}><RotateCcw size={17}/><span>{data.vocabulary.weak ? `Review ${data.vocabulary.weak} weak words` : "My review queue"}</span><ArrowUpRight size={13}/></Link>
      <Link href="/vocabulary/quiz"><ClipboardCheck size={17}/><span>Test my recall</span><ArrowUpRight size={13}/></Link>
    </div>
  </>;
}
