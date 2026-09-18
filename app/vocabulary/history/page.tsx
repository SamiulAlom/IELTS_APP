import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VocabularyHistory } from "@/components/vocabulary/history";
import { PageTitle } from "@/components/ui";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Vocabulary history" };
export const dynamic = "force-dynamic";

export default async function VocabularyHistoryPage() {
  const settings = await getSettings();
  return <>
    <PageTitle eyebrow="Your learning, remembered" title="Vocabulary history" description="Return to the exact words you studied and see how your practice went." action={<Link className="button primary" href="/vocabulary/learn">Start a session<ArrowRight size={15} /></Link>} />
    <VocabularyHistory timezone={settings.timezone} />
  </>;
}
