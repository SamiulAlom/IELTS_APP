import { Suspense } from "react";
import { VocabularyQuiz } from "@/components/vocabulary/quiz";
import { Loading } from "@/components/ui";

export const metadata = { title: "Vocabulary practice test" };

export default function VocabularyQuizPage() {
  return <Suspense fallback={<Loading />}><VocabularyQuiz /></Suspense>;
}
