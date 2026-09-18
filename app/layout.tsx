import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
import "./writing.css";
import "./reading.css";
import { getSettings } from "@/lib/settings";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "IELTS 7.5 Lab — Your daily practice, with purpose", template: "%s | IELTS 7.5 Lab" },
  description: "Your personal IELTS study space. Build vocabulary, practise every skill, and turn daily progress into lasting confidence.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return <html lang="en" data-theme={settings.theme === "dark" ? "dark" : "light"} suppressHydrationWarning><body><AppShell settings={settings}>{children}</AppShell></body></html>;
}
