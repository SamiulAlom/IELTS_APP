import { PageTitle } from "@/components/ui";
import { WritingStudio } from "@/components/writing/studio";

export default async function WritingPage({ searchParams }: { searchParams: Promise<{ id?: string; attempt?: string; draftKey?: string; tab?: string }> }) {
  const { id, attempt, tab, draftKey } = await searchParams;
  return <><PageTitle eyebrow="From idea to argument" title="Writing studio" description="Plan clearly, write with purpose, and keep every draft in your local library."/><WritingStudio key={`${id ?? ""}:${attempt ?? ""}:${tab ?? ""}`} initialId={id} initialAttempt={attempt} initialDraftKey={draftKey} initialTab={tab}/></>;
}
