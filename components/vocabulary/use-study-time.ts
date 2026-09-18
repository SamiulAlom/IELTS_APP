"use client";

import { useCallback, useEffect, useRef } from "react";

/** Counts time while the tab is visible and focused, capped at five minutes per card. */
export function useStudyTime(key: string) {
  const elapsed = useRef(0);
  const started = useRef<number | null>(null);
  useEffect(() => {
    elapsed.current = 0;
    started.current = document.visibilityState === "visible" && document.hasFocus() ? performance.now() : null;
    const pause = () => { if (started.current !== null) elapsed.current += performance.now() - started.current; started.current = null; };
    const resume = () => { if (document.visibilityState === "visible" && document.hasFocus() && started.current === null) started.current = performance.now(); };
    const visibility = () => document.visibilityState === "visible" ? resume() : pause();
    window.addEventListener("blur", pause); window.addEventListener("focus", resume); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("blur", pause); window.removeEventListener("focus", resume); document.removeEventListener("visibilitychange", visibility); };
  }, [key]);
  return useCallback(() => Math.min(300000, Math.round(elapsed.current + (started.current === null ? 0 : performance.now() - started.current))), []);
}
