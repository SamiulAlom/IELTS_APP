import { PageTitle } from "@/components/ui";
import { GrammarPractice } from "@/components/practice/grammar";

export default async function GrammarPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <><PageTitle eyebrow="Accuracy builds confidence" title="Grammar workshop" description="Short lessons and focused exercises for clearer IELTS writing and speaking."/><GrammarPractice initialId={id}/></>;
}
