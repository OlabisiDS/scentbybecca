"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useCart, useFavs } from "@/lib/hooks";
import { openMiniCart } from "@/lib/minicart";
import { Product, addLine, firstAvail, fromPrice, isOut, multiPrice } from "@/lib/types";
import { ngn } from "@/lib/util";

// Product photo box. With more than one photo, they fade into each other slowly, each card on its own timing.
export function CardImage({ p }: { p: { images: string[]; name: string } }) {
  const imgs = (p.images || []).slice(0, 5), [i, setI] = useState(0), [vis, setVis] = useState(false), ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || imgs.length < 2 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting)); io.observe(el); return () => io.disconnect();
  }, [imgs.length]);
  useEffect(() => {
    if (imgs.length < 2 || !vis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setInterval>; const s = setTimeout(() => { t = setInterval(() => setI((v) => (v + 1) % imgs.length), 5200 + Math.random() * 2800); }, Math.random() * 4000);
    return () => { clearTimeout(s); clearInterval(t); };
  }, [imgs.length, vis]);
  return <div className="ph" ref={ref}>{imgs.length ? imgs.map((s, k) => <img key={k} className={"cx" + (k === i ? " on" : "")} src={s} alt={k === 0 ? p.name : ""} loading="lazy" />) : <i aria-hidden="true" />}</div>;
}
export function Pic({ p }: { p: { images: string[]; name: string } }) {
  const src = p.images?.[0];
  return <div className="ph">{src ? <img src={src} alt={p.name} loading="lazy" /> : <i aria-hidden="true" />}</div>;
}
export default function ProductCard({ p }: { p: Product }) {
  const [, setCart] = useCart();
  const [favs, setFavs] = useFavs();
  const out = isOut(p), fav = favs.includes(p.id), many = p.variants.filter((v) => v.available).length > 1;
  return (
    <div className="card">
      <button className={"fav" + (fav ? " on" : "")} aria-pressed={fav} aria-label={fav ? "Remove from favourites" : "Save to favourites"} onClick={() => setFavs((f) => (f.includes(p.id) ? f.filter((x) => x !== p.id) : [...f, p.id]))}>
        <Heart size={19} strokeWidth={1.5} fill={fav ? "currentColor" : "none"} />
      </button>
      <Link href={`/products/${p.slug}`} aria-label={p.name}><CardImage p={p} /></Link>
      <Link href={`/products/${p.slug}`} className="pn">{p.name}</Link>
      <div className="pm">{p.brand}{p.variants.length === 1 && p.variants[0].label ? `${p.brand ? ", " : ""}${p.variants[0].label}` : p.variants.length > 1 ? `${p.brand ? ", " : ""}several sizes` : ""}</div>
      <div className="pp">{multiPrice(p) ? "From " : ""}{ngn(fromPrice(p))} {out && <span className="tag r">Out of stock</span>}</div>
      {out ? <button className="btn o" disabled>Out of stock</button> : many ? <Link className="btn o" href={`/products/${p.slug}`}>Choose size</Link> : (
        <button className="btn o" onClick={() => { setCart((c) => addLine(c, p.id, firstAvail(p).id, 1)); openMiniCart(); }}>Add to cart</button>
      )}
    </div>
  );
}
