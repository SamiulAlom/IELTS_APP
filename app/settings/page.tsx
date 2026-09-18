import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { PageTitle } from "@/components/ui";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <>
    <PageTitle eyebrow="Make it yours" title="Your study preferences" description="Set a goal that fits your day, and build from there." />
    <SettingsForm settings={settings} />
  </>;
}
