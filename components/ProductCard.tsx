"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useCart, useFavs } from "@/lib/hooks";
import { Product, addLine, firstAvail, fromPrice, isOut, multiPrice } from "@/lib/types";
import { ngn } from "@/lib/util";

export function Pic({ p }: { p: { images: string[]; name: string } }) {
  const src = p.images?.[0];
  return <div className="ph">{src ? <img src={src} alt={p.name} loading="lazy" /> : <i aria-hidden="true" />}</div>;
}
export default function ProductCard({ p }: { p: Product }) {
  const [, setCart] = useCart();
  const [favs, setFavs] = useFavs();
  const [done, setDone] = useState(false);
  const out = isOut(p), fav = favs.includes(p.id), many = p.variants.filter((v) => v.available).length > 1;
  return (
    <div className="card">
      <button className={"fav" + (fav ? " on" : "")} aria-pressed={fav} aria-label={fav ? "Remove from favourites" : "Save to favourites"} onClick={() => setFavs((f) => (f.includes(p.id) ? f.filter((x) => x !== p.id) : [...f, p.id]))}>
        <Heart size={20} strokeWidth={1.5} fill={fav ? "currentColor" : "none"} />
      </button>
      <Link href={`/products/${p.slug}`} aria-label={p.name}><Pic p={p} /></Link>
      <Link href={`/products/${p.slug}`} className="pn" style={{ textDecoration: "none" }}>{p.name}</Link>
      <div className="pm">{p.brand}{p.variants.length === 1 && p.variants[0].label ? `, ${p.variants[0].label}` : p.variants.length > 1 ? ", several sizes" : ""}</div>
      <div className="pp">{multiPrice(p) ? "From " : ""}{ngn(fromPrice(p))} {out && <span className="tag r">Out of stock</span>}</div>
      {out ? <button className="btn o" disabled>Out of stock</button> : many ? <Link className="btn o" href={`/products/${p.slug}`}>Choose size</Link> : (
        <button className="btn o" onClick={() => { setCart((c) => addLine(c, p.id, firstAvail(p).id, 1)); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? "Added" : "Add to cart"}</button>
      )}
    </div>
  );
}
