"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, ShieldCheck, Star, Truck, Image as ImgIcon } from "lucide-react";
import HeroSlides from "@/components/HeroSlides";
import LoopRow from "@/components/LoopRow";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { ReviewsSection } from "@/components/Reviews";
import { CATEGORIES, HERO_POSTER, HERO_VIDEO, STORY, STORY_CLOSING, STORY_TITLE, WHATSAPP_NUMBER } from "@/lib/config";
import { useStore } from "@/lib/store";
import { rankBy } from "@/lib/util";

const FEATURES: { slug: string; line: string }[] = [
  { slug: "gift-sets", line: "Thoughtful sets for every occasion." },
  { slug: "perfume-combos", line: "Pairs and trios, put together for you." },
  { slug: "perfume-oils", line: "Perfume oils to layer and wear your way." },
];
export default function HomePage() {
  const { products, covers, shelves, video, slides, ready } = useStore();
  const [tick, setTick] = useState<Record<string, number>>({});
  const picks = rankBy(products.filter((p) => p.featured), shelves["worth"]).slice(0, 10);
  const thumbs = (slug: string) => (covers[slug]?.length ? covers[slug] : ([products.find((p) => p.category === slug && p.images[0])?.images[0]].filter(Boolean) as string[]));
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rot = CATEGORIES.filter((c) => (covers[c.slug]?.length || 0) > 1).map((c) => c.slug);
    if (!rot.length) return;
    const id = setInterval(() => {
      const n = 1 + Math.floor(Math.random() * 3), pick = [...rot].sort(() => Math.random() - 0.5).slice(0, Math.min(n, rot.length));
      setTick((t) => { const o = { ...t }; pick.forEach((s) => (o[s] = (o[s] || 0) + 1)); return o; });
    }, 3200);
    return () => clearInterval(id);
  }, [covers]);
  return (
    <>
      {slides.length > 0 ? (
        <>
          <HeroSlides slides={slides} />
          <section className="intro">
            <div className="eyebrow">The Scents by Becca Brand</div>
            <p className="accent">Find a scent that stays with you.</p>
            <p>Browse designer, affordable and niche fragrances, oils and gift sets.</p>
            <Link className="btn fit" href="/shop">Explore fragrances</Link>
          </section>
        </>
      ) : (
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
      )}
      <div className="wrap">
        <section className="sec"><Reveal><h2>Worth Discovering</h2></Reveal>
          {!ready ? <div className="grid">{[0, 1].map((i) => <div key={i} className="card"><div className="ph" /></div>)}</div> : picks.length === 0 ? <p className="muted" style={{ textAlign: "center" }}>Hand-picked fragrances will appear here soon.</p> : <LoopRow href="/worth-discovering" label="View all">{picks.map((p) => <ProductCard key={p.id} p={p} />)}</LoopRow>}
        </section>
        <section className="sec"><Reveal><h2>Shop by category</h2></Reveal>
          <div className="crows">
            {CATEGORIES.map((c, n) => {
              const imgs = thumbs(c.slug), cur = imgs.length ? (tick[c.slug] || 0) % imgs.length : 0;
              return (
                <Reveal key={c.slug} delay={(n % 3) * 70}>
                  <Link href={`/shop?cat=${c.slug}`} className="crow">
                    <span className="cthumb" aria-hidden="true">{imgs.length ? imgs.map((s, i) => <img key={i} className={"cv" + (i === cur ? " on" : "")} src={s} alt="" loading="lazy" />) : <ImgIcon size={20} strokeWidth={1.5} />}</span>
                    <span className="cn">{c.name}</span><ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
        <section className="sec"><Reveal><h2>Collections</h2></Reveal>
          <div className="fcards">
            {FEATURES.map((f) => { const c = CATEGORIES.find((x) => x.slug === f.slug)!, img = thumbs(f.slug)[0]; return (
              <Reveal key={f.slug}><div className="fcard"><div className="fi">{img && <img src={img} alt="" loading="lazy" />}</div><div className="fb2"><h3>{c.name}</h3><p>{f.line}</p><Link className="btn fit sm" href={`/shop?cat=${f.slug}`}>Shop now</Link></div></div></Reveal>
            ); })}
            <Reveal><div className="fcard"><div className="fi" /><div className="fb2"><h3>Curate your own combo</h3><p>Pick your categories and budget, then let us shuffle a combination for you.</p><Link className="btn fit sm" href="/combo">Try it</Link></div></div></Reveal>
          </div>
        </section>
      </div>
      <ReviewsSection />
      <section className="wrap sec"><Reveal><h2>Why shop with us</h2></Reveal>
        <div className="why">
          <div><b><ShieldCheck size={24} strokeWidth={1.5} /></b><h3>Checked first</h3><p>We carefully check every order before it is dispatched.</p></div>
          <div><b><Truck size={24} strokeWidth={1.5} /></b><h3>Nationwide delivery</h3><p>We deliver across Nigeria.</p></div>
          <div><b><Star size={24} strokeWidth={1.5} /></b><h3>Real reviews</h3><p>Customer reviews on the store, checked before they show.</p></div>
          <div><b><MessageCircle size={24} strokeWidth={1.5} /></b><h3>Ask us anything</h3><p><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp.</a></p></div>
        </div>
      </section>
      <section className="story"><div className="wrap"><Reveal>
        <div className="eyebrow">Our story</div><h2 style={{ fontSize: 38, fontStyle: "italic", fontWeight: 500, margin: "8px 0 14px" }}>{STORY_TITLE}</h2>
        <div style={{ maxWidth: 620 }}>{STORY.slice(0, 2).map((t, i) => <p key={i} style={{ margin: "0 0 12px" }}>{t}</p>)}</div>
        <Link className="btn o fit" href="/info/about">Read our full story</Link>
        <p className="small muted" style={{ marginTop: 14 }}>{STORY_CLOSING}</p>
      </Reveal></div></section>
    </>
  );
}
