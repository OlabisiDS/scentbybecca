"use client";
import { useEffect } from "react";
// Remembers where you were on each page. Pressing Back shows the page from the top, then eases down to your old spot.
export default function ScrollMemory() {
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const get = (): Record<string, number> => { try { return JSON.parse(sessionStorage.getItem("sbb_scroll") || "{}"); } catch { return {}; } };
    const save = () => { const m = get(); m[location.href] = window.scrollY; try { sessionStorage.setItem("sbb_scroll", JSON.stringify(m)); } catch { /* ignore */ } };
    const onClick = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("a")) save(); };
    const onPop = () => {
      const y = get()[location.href]; if (!y) return;
      window.scrollTo(0, 0);
      let tries = 0;
      const go = () => { if (document.documentElement.scrollHeight >= y + window.innerHeight * 0.6 || tries++ > 20) window.scrollTo({ top: y, behavior: "smooth" }); else setTimeout(go, 100); };
      setTimeout(go, 160);
    };
    document.addEventListener("click", onClick, true); window.addEventListener("popstate", onPop); window.addEventListener("pagehide", save);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("popstate", onPop); window.removeEventListener("pagehide", save); };
  }, []);
  return null;
}
