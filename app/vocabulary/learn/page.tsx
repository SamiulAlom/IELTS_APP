import { Suspense } from "react";
import { VocabularyLearn } from "@/components/vocabulary/learn";
import { Loading } from "@/components/ui";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Learn vocabulary" };

export default async function VocabularyLearnPage() {
  const settings = await getSettings();
  return <Suspense fallback={<Loading />}><VocabularyLearn defaultSize={settings.vocabularySessionSize} /></Suspense>;
}
