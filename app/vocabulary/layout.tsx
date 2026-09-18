import { VocabularyNavigation } from "@/components/vocabulary/navigation";

export default function VocabularyLayout({ children }: { children: React.ReactNode }) {
  return <><VocabularyNavigation />{children}</>;
}
