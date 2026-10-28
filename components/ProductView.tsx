"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Droplet, Heart, Hourglass, Minus, Plus, Radio, Share2, Wind, type LucideIcon } from "lucide-react";
import Lightbox from "./Lightbox";
import Policy from "./Policy";
import ProductCard from "./ProductCard";
import { ProductReviews } from "./Reviews";
import Sheet from "./Sheet";
import { CATEGORIES } from "@/lib/config";
import { useCart, useFavs } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { addLine, firstAvail, isOut } from "@/lib/types";
import { ngn } from "@/lib/util";

export default function ProductView({ slug }: { slug: string }) {
  const router = useRouter();
  const { products, ready } = useStore();
  const [, setCart] = useCart();
  const [favs, setFavs] = useFavs();
  const [vid, setVid] = useState(""), [qty, setQty] = useState(1), [added, setAdded] = useState(false), [idx, setIdx] = useState(0), [lb, setLb] = useState(false), [pol, setPol] = useState(false), [copied, setCopied] = useState(false);
  if (!ready) return <div className="wrap pad"><div className="pd"><div className="ph" /></div></div>;
  const p = products.find((x) => x.slug === slug);
  if (!p) return <div className="wrap pad"><h1>Product not found</h1><p className="muted">This product is not available.</p><Link className="btn fit" href="/shop">Continue shopping</Link></div>;
  const sel = p.variants.find((v) => v.id === vid && v.available) ?? firstAvail(p), out = isOut(p) || !sel.available;
  const cat = CATEGORIES.find((c) => c.slug === p.category), fav = favs.includes(p.id), imgs = p.images;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const stats: { k: string; I: LucideIcon; v: string }[] = [
    { k: "Longevity", I: Hourglass, v: p.longevity ? `${p.longevity}/10` : "-" }, { k: "Projection", I: Radio, v: p.projection ? `${p.projection}/10` : "-" },
    { k: "Sillage", I: Wind, v: p.sillage ? `${p.sillage}/10` : "-" }, { k: "Concentration", I: Droplet, v: p.concentration || "-" },
  ];
  const share = async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: p.name, url }); else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } } catch { /* cancelled */ } };
  const add = () => { setCart((c) => addLine(c, p.id, sel.id, qty)); setAdded(true); };
  return (
    <div className="wrap">
      <nav className="crumb" aria-label="Breadcrumb" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {cat && <Link href={`/shop?cat=${cat.slug}`} style={{ display: "inline-flex", alignItems: "center", minHeight: 40 }}><ChevronLeft size={16} />Back to {cat.name}</Link>}
        <Link href="/shop" style={{ display: "inline-flex", alignItems: "center", minHeight: 40 }}>All fragrances</Link>
      </nav>
      <div className="pd">
        <div>
          <button className="ph galmain" onClick={() => imgs.length > 0 && setLb(true)} aria-label={imgs.length ? "Enlarge photo" : "No photo yet"} disabled={!imgs.length}>{imgs[idx] ? <img src={imgs[idx]} alt={`${p.name}, photo ${idx + 1}`} /> : <i aria-hidden="true" />}</button>
          {imgs.length > 1 && <div className="thumbs">{imgs.map((s, i) => <button key={i} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} aria-label={`Show photo ${i + 1}`}><img src={s} alt="" /></button>)}</div>}
        </div>
        <div>
          {p.brand && <div className="small" style={{ letterSpacing: ".12em", textTransform: "uppercase", color: "var(--gold-dark)", fontWeight: 600 }}>{p.brand}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h1 style={{ fontSize: 26, margin: "4px 0" }}>{p.name}</h1>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="ib" style={{ border: "1px solid var(--border)", background: "#fff" }} aria-label="Share this product" onClick={share}><Share2 size={20} strokeWidth={1.5} /></button>
              <button className={"ib" + (fav ? " fav on" : "")} style={{ position: "static", border: "1px solid var(--border)", background: "#fff" }} aria-pressed={fav} aria-label={fav ? "Remove from favourites" : "Save to favourites"} onClick={() => setFavs((f) => (f.includes(p.id) ? f.filter((x) => x !== p.id) : [...f, p.id]))}><Heart size={20} strokeWidth={1.5} fill={fav ? "currentColor" : "none"} /></button>
            </div>
          </div>
          {copied && <div className="fb" role="status">Link copied.</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
            <span className="price">{ngn(sel.price)}</span>
            <span className={"tag " + (out ? "r" : "g")}>{out ? "Out of stock" : "Available"}</span>
          </div>
          {p.variants.length > 1 && <><span className="lab" style={{ margin: 0 }}>Size</span><div className="sizes" role="radiogroup" aria-label="Size">{p.variants.map((v) => <button key={v.id} role="radio" aria-checked={v.id === sel.id} className={"sz" + (v.id === sel.id ? " on" : "")} disabled={!v.available} onClick={() => setVid(v.id)}>{v.label || "Standard"}<br />{ngn(v.price)}</button>)}</div></>}
          {p.variants.length === 1 && sel.label && <div className="muted">{sel.label}</div>}
          {p.description && <p>{p.description}</p>}
          {p.notes && <p><b>Fragrance notes:</b> {p.notes}</p>}
          <div className="stats">{stats.map(({ k, I, v }) => <div className="st" key={k}><b><I size={26} strokeWidth={1.5} /></b><span>{k}</span><i>{v}</i></div>)}</div>
          <details className="small muted" style={{ marginBottom: 12 }}><summary style={{ cursor: "pointer", minHeight: 32 }}>What do these mean?</summary>
            <p>Longevity is how long the scent lasts. Projection is how far it travels from you at first. Sillage is the trail it leaves as you move. Concentration is the strength type of the perfume. Ratings are 1 to 10 and are given by ScentbyBecca. A dash means not rated yet.</p></details>
          {out ? <p className="warn">This item is out of stock right now. Message us on WhatsApp to ask when it returns.</p> : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0" }}>
                <span style={{ fontWeight: 600 }}>Quantity</span>
                <div className="qty"><button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={18} /></button><span aria-live="polite">{qty}</span><button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))}><Plus size={18} /></button></div>
              </div>
              <div className="row2"><button className="btn o" onClick={add}>Add to cart</button><button className="btn" onClick={() => { setCart((c) => addLine(c, p.id, sel.id, qty)); router.push("/cart"); }}>Buy now</button></div>
              {added && <div className="fb" role="status">Added to your cart. <Link href="/cart">View cart</Link></div>}
            </>
          )}
          <button className="linkbtn" onClick={() => setPol(true)}>Delivery and refund policy</button>
        </div>
      </div>
      <ProductReviews productId={p.id} />
      {related.length > 0 && <section className="sec"><h2>You may also like</h2><div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
      {lb && <Lightbox images={imgs} start={idx} onClose={() => setLb(false)} />}
      {pol && <Sheet title="Delivery and refund policy" onClose={() => setPol(false)}><Policy /></Sheet>}
    </div>
  );
}
