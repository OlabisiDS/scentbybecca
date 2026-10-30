"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/types";

const MS = 8000;
function Wrap({ s, children }: { s: HeroSlide; children: React.ReactNode }) {
  if (!s.href) return <div>{children}</div>;
  return /^https?:/.test(s.href) ? <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.title || "Open"}>{children}</a> : <Link href={s.href} aria-label={s.title || "Open"}>{children}</Link>;
}
export default function HeroSlides({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0), [paused, setPaused] = useState(false), [reduced, setReduced] = useState(false);
  const x0 = useRef(0);
  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => { if (i >= slides.length) setI(0); }, [slides.length, i]);
  useEffect(() => {
    if (slides.length < 2 || paused || reduced) return;
    const t = setTimeout(() => setI((v) => (v + 1) % slides.length), MS);
    return () => clearTimeout(t);
  }, [i, paused, reduced, slides.length]);
  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length);
  return (
    <section className={"hs" + (paused ? " paused" : "")} aria-roledescription="carousel" aria-label="Featured"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { x0.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 50 && slides.length > 1) go(d < 0 ? 1 : -1); setPaused(false); }}>
      <div className="hs-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => (
          <div className="hs-slide" key={s.id} aria-hidden={k !== i} aria-label={`Slide ${k + 1} of ${slides.length}`}>
            <Wrap s={s}>
              {s.kind === "video"
                ? (k === i ? <video src={s.videoUrl} poster={s.posterUrl || undefined} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" /> : s.posterUrl ? <img src={s.posterUrl} alt="" /> : null)
                : <picture>{s.imageWideUrl && <source media="(min-width:800px)" srcSet={s.imageWideUrl} />}<img src={s.imageUrl} alt={s.title} loading={k === 0 ? "eager" : "lazy"} /></picture>}
            </Wrap>
          </div>
        ))}
      </div>
      {slides.length > 1 && <div className="hs-bars">{slides.map((s, k) => <button key={s.id} className={k === i ? "on" : ""} aria-label={`Show slide ${k + 1}`} aria-current={k === i} onClick={() => setI(k)}><span /></button>)}</div>}
    </section>
  );
}
