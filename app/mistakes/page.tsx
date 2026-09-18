import type { Metadata } from "next";
import { BookCheck, NotebookPen } from "lucide-react";
import { MistakeList } from "@/components/mistake-list";
import { ErrorNotice, PageTitle, StatCard } from "@/components/ui";
import { getMistakes, mistakeFiltersSchema } from "@/lib/mistakes";

export const metadata: Metadata = { title: "Mistake notebook" };
export const dynamic = "force-dynamic";

export default async function MistakesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const single = (value: string | string[] | undefined) => typeof value === "string" ? value : undefined;
  const parsed = mistakeFiltersSchema.safeParse({ module: single(query.module), status: single(query.status), page: single(query.page) });
  const data = await getMistakes(parsed.success ? parsed.data : {});
  return <>
    <PageTitle eyebrow="Turn mistakes into progress" title="Your mistake notebook" description="Understand the correction, try it again, and mark it resolved when you're ready." />
    <div className="stats-grid">
      <StatCard label="Ready to revisit" value={data.unresolved} detail="Saved mistakes across your practice" icon={<NotebookPen size={18} />} color="peach" />
      <StatCard label="Marked resolved" value={data.resolved} detail="Corrections you've reviewed" icon={<BookCheck size={18} />} />
    </div>
    {!parsed.success && <ErrorNotice message="Those filters weren't valid, so your unresolved mistakes are shown." />}
    <MistakeList data={data} />
  </>;
}
