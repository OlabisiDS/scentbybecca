"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Droplet, Heart, Hourglass, Minus, Plus, Radio, Share2, Wind, type LucideIcon } from "lucide-react";
import Lightbox from "./Lightbox";
import LoopRow from "./LoopRow";
import Policy from "./Policy";
import ProductCard from "./ProductCard";
import { ProductReviews } from "./Reviews";
import { CATEGORIES } from "@/lib/config";
import { useCart, useFavs } from "@/lib/hooks";
import { openMiniCart } from "@/lib/minicart";
import { useStore } from "@/lib/store";
import { addLine, firstAvail, isOut, ratingText } from "@/lib/types";
import { ngn } from "@/lib/util";

export default function ProductView({ slug }: { slug: string }) {
  const router = useRouter();
  const { products, reviews, ready } = useStore();
  const [, setCart] = useCart();
  const [favs, setFavs] = useFavs();
  const gal = useRef<HTMLDivElement>(null);
  const [vid, setVid] = useState(""), [qty, setQty] = useState(1), [idx, setIdx] = useState(0), [lb, setLb] = useState(false), [copied, setCopied] = useState(false);
  if (!ready) return <div className="wrap pad"><div className="pd"><div className="ph" /></div></div>;
  const p = products.find((x) => x.slug === slug);
  if (!p) return <div className="wrap pad"><h1 style={{ fontSize: 32 }}>Product not found</h1><p className="muted">This product is not available.</p><Link className="btn fit" href="/shop">Continue shopping</Link></div>;
  const sel = p.variants.find((v) => v.id === vid && v.available) ?? firstAvail(p), out = isOut(p) || !sel.available;
  const cat = CATEGORIES.find((c) => c.slug === p.category), fav = favs.includes(p.id), imgs = p.images;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 8);
  const stats: { k: string; I: LucideIcon; v: string }[] = [
    { k: "Longevity", I: Hourglass, v: ratingText(p, "longevity") }, { k: "Projection", I: Radio, v: ratingText(p, "projection") },
    { k: "Sillage", I: Wind, v: ratingText(p, "sillage") }, { k: "Concentration", I: Droplet, v: p.concentration || "-" },
  ];
  const hasStats = stats.some((s) => s.v !== "-"), noteLines = p.notes.split("\n").map((l) => l.trim()).filter(Boolean), nRev = reviews.filter((r) => r.target === p.id).length;
  const share = async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: p.name, url }); else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } } catch { /* cancelled */ } };
  const add = () => { setCart((c) => addLine(c, p.id, sel.id, qty)); openMiniCart(); };
  const toFav = () => setFavs((f) => (f.includes(p.id) ? f.filter((x) => x !== p.id) : [...f, p.id]));
  return (
    <div className="wrap">
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / {cat ? <Link href={`/shop?cat=${cat.slug}`}>{cat.name}</Link> : <Link href="/shop">Shop</Link>} / <span>{p.name}</span></nav>
      <div className="pd">
        <div>
          {imgs.length > 0 ? (<>
            <div className="gal-track" ref={gal} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
              {imgs.map((s, i) => <button key={i} className="gal-s" onClick={() => setLb(true)} aria-label={`Enlarge photo ${i + 1}`}><img src={s} alt={`${p.name}, photo ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} /></button>)}
            </div>
            {imgs.length > 1 && <div className="gal-bar" aria-hidden="true"><span style={{ width: `${100 / imgs.length}%`, transform: `translateX(${idx * 100}%)` }} /></div>}
            {imgs.length > 1 && <div className="thumbs">{imgs.map((s, i) => <button key={i} className={i === idx ? "on" : ""} onClick={() => gal.current?.scrollTo({ left: i * gal.current.clientWidth, behavior: "smooth" })} aria-label={`Show photo ${i + 1}`}><img src={s} alt="" /></button>)}</div>}
          </>) : <div className="ph" style={{ aspectRatio: "4/5" }}><i aria-hidden="true" /></div>}
        </div>
        <div>
          {p.brand && <div className="eyebrow">{p.brand}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h1 style={{ fontSize: 36, margin: "4px 0 6px" }}>{p.name}</h1>
            <button className="ib" style={{ border: "1px solid var(--border)", flex: "none" }} aria-label="Share this product" onClick={share}><Share2 size={19} strokeWidth={1.5} /></button>
          </div>
          {copied && <div className="fb" role="status">Link copied.</div>}
          <div className="price">{ngn(sel.price)}</div>
          <div className="small" style={{ margin: "6px 0 12px", display: "flex", alignItems: "center", gap: 6, color: out ? "var(--red)" : "var(--green)" }}>{!out && <Check size={16} strokeWidth={1.5} />}<span style={{ font: "700 11px var(--display)", letterSpacing: ".18em", textTransform: "uppercase" }}>{out ? "Out of stock" : "In stock"}</span></div>
          {p.variants.length > 1 && <><span className="lab" style={{ margin: 0 }}>Size</span><div className="sizes" role="radiogroup" aria-label="Size">{p.variants.map((v) => <button key={v.id} role="radio" aria-checked={v.id === sel.id} className={"sz" + (v.id === sel.id ? " on" : "")} disabled={!v.available} onClick={() => setVid(v.id)}>{v.label || "Standard"}<br />{ngn(v.price)}</button>)}</div></>}
          {p.variants.length === 1 && sel.label && <div className="muted">{sel.label}{p.concentration ? `, ${p.concentration}` : ""}</div>}
          {out ? <p className="warn">This item is out of stock right now. Message us on WhatsApp to ask when it returns.</p> : (<>
            <div className="buy">
              <div className="qty"><button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={16} /></button><span aria-live="polite">{qty}</span><button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}><Plus size={16} /></button></div>
              <button className="btn" onClick={add}>Add to cart</button>
              <button className={"fv2" + (fav ? " on" : "")} aria-pressed={fav} aria-label={fav ? "Remove from favourites" : "Save to favourites"} onClick={toFav}><Heart size={20} strokeWidth={1.5} fill={fav ? "currentColor" : "none"} /></button>
            </div>
            <button className="btn o" onClick={() => { setCart((c) => addLine(c, p.id, sel.id, qty)); router.push("/cart"); }}>Buy now</button></>)}
          {out && <button className={"btn o"} onClick={toFav}>{fav ? "Saved to favourites" : "Save to favourites"}</button>}
          <div style={{ marginTop: 22 }}>
            {p.description && <details className="acc" open><summary>Description</summary><div className="pre">{p.description}</div></details>}
            {noteLines.length > 0 && <details className="acc"><summary>Fragrance notes</summary><div className="notes">{noteLines.map((l, i) => { const m = /^([^:]{2,24}):\s*(.*)$/.exec(l); return m ? <p key={i}><b>{m[1]}:</b> {m[2]}</p> : <p key={i}>{l}</p>; })}</div></details>}
            {hasStats && <details className="acc"><summary>Scent profile</summary><div><div className="stats">{stats.map(({ k, I, v }) => <div className="st" key={k}><b><I size={24} strokeWidth={1.5} /></b><span>{k}</span><i>{v}</i></div>)}</div>
              <p className="small muted">Longevity is how long the scent lasts. Projection is how far it travels from you at first. Sillage is the trail it leaves as you move. Ratings are given by ScentbyBecca, as a number out of 10 or a grade from Fair to Excellent. A dash means not rated yet.</p></div></details>}
            <details className="acc"><summary>Delivery and refund policy</summary><div><Policy /></div></details>
            <details className="acc"><summary>Reviews ({nRev})</summary><div><ProductReviews productId={p.id} bare /></div></details>
          </div>
        </div>
      </div>
      {related.length > 0 && <section className="sec"><h2>You may also like</h2><LoopRow>{related.map((r) => <ProductCard key={r.id} p={r} />)}</LoopRow></section>}
      {lb && <Lightbox images={imgs} start={idx} onClose={() => setLb(false)} />}
    </div>
  );
}
