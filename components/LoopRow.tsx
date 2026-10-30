"use client";
import Link from "next/link";
import { Children, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
// A horizontal row that loops without an end when there are enough items.
export default function LoopRow({ children, href, label = "View all" }: { children: React.ReactNode; href?: string; label?: string }) {
  const items = Children.toArray(children), n = items.length, loop = n >= 5, ref = useRef<HTMLDivElement>(null);
  const list = loop ? [...items, ...items, ...items] : items;
  useEffect(() => {
    const el = ref.current; if (!el || !loop) return;
    const w = () => el.scrollWidth / 3; el.scrollLeft = w();
    const on = () => { const s = w(); if (el.scrollLeft < s * 0.25) el.scrollLeft += s; else if (el.scrollLeft > s * 1.75) el.scrollLeft -= s; };
    el.addEventListener("scroll", on, { passive: true }); return () => el.removeEventListener("scroll", on);
  }, [loop, n]);
  const go = (d: number) => { const el = ref.current; if (!el) return; const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth || 200; el.scrollBy({ left: d * (step + 10) * 2, behavior: "smooth" }); };
  return (
    <div className="loop">
      <div className="loop-row" ref={ref}>{list.map((c, i) => <div key={i}>{c}</div>)}</div>
      <div className="loop-foot">
        <div className="arrows"><button aria-label="Scroll left" onClick={() => go(-1)}><ArrowLeft size={18} strokeWidth={1.5} /></button><button aria-label="Scroll right" onClick={() => go(1)}><ArrowRight size={18} strokeWidth={1.5} /></button></div>
        {href && <Link className="btn o fit sm" href={href}>{label}<ArrowRight size={16} strokeWidth={1.5} /></Link>}
      </div>
    </div>
  );
}
