"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function VocabularyNavigation() {
  const pathname = usePathname();
  return <nav className="tabs" aria-label="Vocabulary sections">{[
    ["/vocabulary", "Word bank"], ["/vocabulary/learn", "Learn words"], ["/vocabulary/quiz", "Take a test"], ["/vocabulary/review", "Due for review"], ["/vocabulary/history", "History"],
  ].map(([href, title]) => <Link key={href} href={href} className={`tab${pathname === href ? " active" : ""}`} aria-current={pathname === href ? "page" : undefined}>{title}</Link>)}</nav>;
}
