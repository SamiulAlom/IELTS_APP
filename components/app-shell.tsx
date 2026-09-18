"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, CalendarDays, ChartNoAxesCombined, ChevronRight, ClipboardCheck, GraduationCap, LayoutDashboard, LibraryBig, Menu, Mic, Moon, NotebookPen, Search, Settings, ShieldCheck, Sparkles, SpellCheck, Sun, Target, X } from "lucide-react";
import type { ProfileSettings } from "@/lib/settings";
import { request } from "@/lib/client";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today's plan", icon: CalendarDays },
  { href: "/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/speaking", label: "Speaking", icon: Mic },
  { href: "/writing", label: "Writing", icon: NotebookPen },
  { href: "/reading", label: "Reading", icon: BookOpen },
  { href: "/grammar", label: "Grammar", icon: SpellCheck },
];
const secondary = [
  { href: "/mistakes", label: "Mistake center", icon: ShieldCheck },
  { href: "/mock-tests", label: "Practice tests", icon: ClipboardCheck },
  { href: "/progress", label: "My progress", icon: ChartNoAxesCombined },
  { href: "/resources", label: "Resources", icon: LibraryBig },
];

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 680px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function AppShell({ settings, children }: { settings: ProfileSettings; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [themeError, setThemeError] = useState("");
  const [savingTheme, setSavingTheme] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia("(max-width: 680px)").matches, () => false);
  const active = [...navigation, ...secondary, { href: "/settings", label: "Settings" }, { href: "/search", label: "Search" }].find(item => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => { document.documentElement.dataset.theme = settings.theme === "system" ? media.matches ? "dark" : "light" : settings.theme; };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [settings.theme]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); document.querySelector<HTMLAnchorElement>("a.top-search")?.click(); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    if (!isMobile || !open) return;
    const drawer = document.getElementById("primary-navigation");
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLElement>("button, a")?.focus();
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = [...(drawer?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? [])].filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", containFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", containFocus);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isMobile, open]);
  async function toggleTheme() {
    if (savingTheme) return;
    setSavingTheme(true);
    setThemeError("");
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { await request("/api/settings", { theme }, "PATCH"); document.documentElement.dataset.theme = theme; router.refresh(); }
    catch (error) { setThemeError(error instanceof Error ? error.message : "Could not save theme."); }
    finally { setSavingTheme(false); }
  }
  const navLink = (item: typeof navigation[number]) => {
    const selected = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return <Link key={item.href} className={`nav-link ${selected ? "active" : ""}`} href={item.href} aria-current={selected ? "page" : undefined} onClick={() => setOpen(false)}><item.icon size={17} strokeWidth={1.7}/>{item.label}</Link>;
  };
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <button className={`sidebar-overlay ${open ? "open" : ""}`} aria-label="Close navigation" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}/>
    <aside id="primary-navigation" className={`sidebar ${open ? "open" : ""}`} role={isMobile ? "dialog" : undefined} aria-modal={isMobile && open ? true : undefined} aria-label="Main navigation" inert={isMobile && !open}>
      <div className="mobile-drawer-top"><span>Your study space</span><button className="icon-button" aria-label="Close menu" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-icon"><GraduationCap size={23}/></span><span><span className="brand-title">IELTS <b>7.5</b> Lab</span><span className="brand-caption" style={{ display: "block" }}>SMALL STEPS. BIG POSSIBILITIES.</span></span></Link>
      <nav><div className="nav-label">YOUR STUDY SPACE</div>{navigation.map(navLink)}<div className="nav-label">REFLECT & GROW</div>{secondary.map(navLink)}</nav>
      <div className="sidebar-bottom"><div className="goal-note"><h3 style={{ display: "flex", alignItems: "center", gap: 7 }}><Sparkles size={14}/>A little progress, every day.</h3><p>Your next chapter starts with today&apos;s practice.</p><Link href="/today" onClick={() => setOpen(false)}>Make time for your goal <ArrowUpRight size={12} style={{ display: "inline" }}/></Link></div>
        {navLink({ href: "/settings", label: "Settings", icon: Settings })}<Link className="profile-mini" href="/settings" onClick={() => setOpen(false)}><span className="avatar">{settings.name.slice(0, 2).toUpperCase()}</span><span><strong>{settings.name}</strong><small>Band {settings.targetBand.toFixed(1)} in sight</small></span><ChevronRight size={14} style={{ marginLeft: "auto", color: "var(--muted)" }}/></Link>
      </div>
    </aside>
    <div className="main-shell" inert={isMobile && open}><header className="topbar"><button className="icon-button mobile-menu-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? <X size={18}/> : <Menu size={18}/>}</button><span className="mobile-brand">IELTS 7.5 Lab</span><div className="breadcrumb">My workspace <ChevronRight size={12}/><strong>{active?.label ?? "Practice"}</strong></div><div className="topbar-actions"><Link href="/search" className="top-search" aria-label="Search your learning library"><Search size={16}/><span>Search your library</span><kbd>Ctrl K</kbd></Link><button className="icon-button" onClick={toggleTheme} disabled={savingTheme} aria-label="Toggle light and dark mode">{settings.theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}</button><Link href="/settings" className="avatar" aria-label="Your profile">{settings.name.slice(0, 2).toUpperCase()}</Link></div></header>
      <main id="main-content" className="content" tabIndex={-1}>{themeError && <p role="alert" className="notice error">{themeError}</p>}{children}<p className="footer-note"><Target size={12}/> Built for your next chapter. One focused session at a time.</p></main>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Quick navigation" inert={isMobile && open}>
      {[{ href: "/", label: "Home", icon: LayoutDashboard }, { href: "/today", label: "Today", icon: CalendarDays }, { href: "/vocabulary", label: "Words", icon: BookOpen }, { href: "/progress", label: "Progress", icon: ChartNoAxesCombined }].map(item => {
        const selected = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return <Link key={item.href} href={item.href} className={selected ? "active" : ""} aria-current={selected ? "page" : undefined}><item.icon size={19}/><span>{item.label}</span></Link>;
      })}
      <button onClick={() => setOpen(true)} aria-label="More navigation" aria-expanded={open} aria-controls="primary-navigation"><Menu size={19}/><span>More</span></button>
    </nav>
  </div>;
}
