import { Suspense } from "react";
import { VocabularyBank } from "@/components/vocabulary/bank";
import { Loading } from "@/components/ui";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Vocabulary bank" };

export default async function VocabularyPage() {
  const settings = await getSettings();
  return <Suspense fallback={<Loading />}><VocabularyBank timezone={settings.timezone} /></Suspense>;
}
