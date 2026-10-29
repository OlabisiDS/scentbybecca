"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Image as ImgIcon } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { PromoBanner } from "@/components/Promos";
import { ReviewsPreview } from "@/components/Reviews";
import { CATEGORIES, HERO_POSTER, HERO_VIDEO, STORY, STORY_CLOSING, STORY_TITLE } from "@/lib/config";
import { useStore } from "@/lib/store";
import { rankBy } from "@/lib/util";

export default function HomePage() {
  const { products, covers, shelves, video, ready } = useStore();
  const [tick, setTick] = useState<Record<string, number>>({});
  const picks = rankBy(products.filter((p) => p.featured), shelves["worth"]).slice(0, 4);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rot = CATEGORIES.filter((c) => (covers[c.slug]?.length || 0) > 1).map((c) => c.slug);
    if (!rot.length) return;
    const id = setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 3), pick = [...rot].sort(() => Math.random() - 0.5).slice(0, Math.min(n, rot.length));
      setTick((t) => { const o = { ...t }; pick.forEach((s) => (o[s] = (o[s] || 0) + 1)); return o; });
    }, 2800);
    return () => clearInterval(id);
  }, [covers]);
  return (
    <>
      <PromoBanner />
      <section className="hero" style={{ backgroundImage: `url(${video?.posterUrl || HERO_POSTER})` }}>
        <video key={video?.id || "default"} className="hv" autoPlay muted loop playsInline poster={video?.posterUrl || HERO_POSTER} preload="metadata" aria-hidden="true"><source src={video?.videoUrl || HERO_VIDEO} type={video?.videoUrl?.endsWith(".webm") ? "video/webm" : "video/mp4"} /></video>
        <div className="ov" aria-hidden="true" />
        <div className="in">
          <h1>The Scents by Becca Brand</h1>
          <p className="accent">Find a scent that stays with you.</p>
          <p className="lead">Browse designer, affordable and niche fragrances, oils and gift sets.</p>
          <Link className="btn" href="/shop">Explore fragrances</Link>
        </div>
      </section>
      <div className="wrap">
        <section className="sec"><Reveal><h2>Shop by category</h2></Reveal>
          <div className="banners">
            {CATEGORIES.map((c, n) => {
              const imgs = covers[c.slug]?.length ? covers[c.slug] : ([products.find((p) => p.category === c.slug && p.images[0])?.images[0]].filter(Boolean) as string[]);
              const cur = imgs.length ? (tick[c.slug] || 0) % imgs.length : 0;
              return (
                <Reveal key={c.slug} delay={(n % 2) * 90}>
                  <Link href={`/shop?cat=${c.slug}`} className="banner" aria-label={c.name}>
                    <div className="bi">{imgs.map((s, i) => <img key={i} className={"cv" + (i === cur ? " on" : "")} src={s} alt="" loading="lazy" />)}</div>
                    {!imgs.length && <ImgIcon className="bph" size={28} strokeWidth={1.5} aria-hidden="true" />}
                    <div className="bo" aria-hidden="true" />
                    <div className="bt"><span className="bn">{c.name}</span><span className="bc">Shop now <ArrowRight size={16} strokeWidth={1.5} /></span></div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
        <section className="sec"><Reveal><div className="hrow"><h2>Worth Discovering</h2><Link href="/worth-discovering" style={{ fontWeight: 600, color: "var(--gold-dark)" }}>View all</Link></div></Reveal>
          {!ready ? <div className="grid">{[0, 1, 2, 3].map((i) => <div key={i} className="card"><div className="ph" /></div>)}</div> : picks.length === 0 ? <p className="muted">Hand-picked fragrances will appear here soon.</p> : <div className="grid">{picks.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 80}><ProductCard p={p} /></Reveal>)}</div>}
          {picks.length > 0 && <div style={{ marginTop: 16 }}><Link className="btn o fit" href="/worth-discovering">View all Worth Discovering</Link></div>}
        </section>
      </div>
      <section className="story"><div className="wrap"><Reveal>
        <div className="eb">Our story</div><h2 style={{ fontSize: 26, margin: "8px 0 14px" }}>{STORY_TITLE}</h2>
        <div style={{ maxWidth: 620 }}>{STORY.slice(0, 2).map((t, i) => <p key={i} style={{ margin: "0 0 12px" }}>{t}</p>)}</div>
        <Link className="btn o fit" href="/info/about">Read our full story</Link>
        <p className="small muted" style={{ marginTop: 14 }}>{STORY_CLOSING}</p>
      </Reveal></div></section>
      <ReviewsPreview />
    </>
  );
}
