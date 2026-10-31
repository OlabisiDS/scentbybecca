"use client";
import { Children, useEffect, useRef } from "react";
// A horizontal row of cards. With enough cards it loops without an end.
// With auto set, it drifts sideways by itself, and stops for a few seconds whenever someone touches it.
export default function LoopRow({ children, auto = false }: { children: React.ReactNode; auto?: boolean }) {
  const items = Children.toArray(children), n = items.length, loop = n >= 5, ref = useRef<HTMLDivElement>(null), hold = useRef(0);
  const list = loop ? [...items, ...items, ...items] : items;
  useEffect(() => {
    const el = ref.current; if (!el || !loop) return;
    const w = () => el.scrollWidth / 3; el.scrollLeft = w();
    let t: ReturnType<typeof setTimeout>;
    const settle = () => { clearTimeout(t); t = setTimeout(() => { const s = w(); if (el.scrollLeft < s * 0.5) el.scrollLeft += s; else if (el.scrollLeft > s * 1.5) el.scrollLeft -= s; }, 140); };
    el.addEventListener("scroll", settle, { passive: true });
    return () => { el.removeEventListener("scroll", settle); clearTimeout(t); };
  }, [loop, n]);
  useEffect(() => {
    const el = ref.current;
    if (!el || !auto || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const touch = () => { hold.current = Date.now() + 7000; };
    const evs: [string, AddEventListenerOptions | undefined][] = [["pointerdown", undefined], ["touchstart", { passive: true }], ["wheel", { passive: true }], ["mouseenter", undefined]];
    evs.forEach(([e, o]) => el.addEventListener(e, touch, o));
    const id = setInterval(() => {
      if (Date.now() < hold.current || document.hidden || el.scrollWidth <= el.clientWidth) return;
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
      const first = el.firstElementChild as HTMLElement | null; if (!first) return;
      if (!loop && el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: first.offsetWidth + 10, behavior: "smooth" });
    }, 3800);
    return () => { clearInterval(id); evs.forEach(([e]) => el.removeEventListener(e, touch)); };
  }, [auto, n, loop]);
  return <div className="loop"><div className="loop-row" ref={ref}>{list.map((c, i) => <div key={i}>{c}</div>)}</div></div>;
}
