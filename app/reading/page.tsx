import { PageTitle } from "@/components/ui";
import { ReadingPractice } from "@/components/practice/reading";
import { ReadingStudio } from "@/components/reading/studio";

export default async function ReadingPage({ searchParams }: { searchParams: Promise<{ id?: string; attempt?: string; tab?: string; focus?: string; category?: string; layer?: string }> }) {
  const { id, attempt, tab, focus, category, layer } = await searchParams;
  const legacy=tab==="starter"||!!id&&!id.startsWith("reading-gold-")&&!id.startsWith("import-")&&!id.startsWith("reading-real-");
  return <><PageTitle eyebrow="Read with purpose" title={legacy?"Starter reading practice":"Reading studio"} description="Understand why. Locate the evidence. Build confident reading."/>{legacy?<><p><a href="/reading" className="text-link">Open the Reading studio →</a></p><ReadingPractice initialId={id}/></>:<ReadingStudio key={`${id??''}:${attempt??''}:${tab??''}:${category??''}:${layer??''}`}  category={category} layer={layer} initialFocus={focus} initialId={id} initialAttempt={attempt} tab={tab}/>}</>;
}
