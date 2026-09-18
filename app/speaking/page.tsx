import { PageTitle } from "@/components/ui";
import { SpeakingPractice } from "@/components/practice/speaking";

export default async function SpeakingPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <><PageTitle eyebrow="Find your own words" title="Speaking room" description="Build a natural answer, practise aloud, and reflect on what to improve."/><SpeakingPractice initialId={id}/></>;
}
