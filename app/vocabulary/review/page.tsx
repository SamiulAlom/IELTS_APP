import { Suspense } from "react";
import { VocabularyBank } from "@/components/vocabulary/bank";
import { Loading } from "@/components/ui";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Vocabulary review" };

export default async function VocabularyReviewPage() {
  const settings = await getSettings();
  return <Suspense fallback={<Loading />}><VocabularyBank review timezone={settings.timezone} /></Suspense>;
}
