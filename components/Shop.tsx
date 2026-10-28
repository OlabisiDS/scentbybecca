"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "./ProductCard";
import Sheet from "./Sheet";
import { CATEGORIES, WHATSAPP_NUMBER } from "@/lib/config";
import { useStore } from "@/lib/store";
import { fromPrice, isOut } from "@/lib/types";
import { rankBy } from "@/lib/util";

export default function Shop({ cat, sub, q, pick }: { cat: string; sub: string; q: string; pick?: "worth" }) {
  const router = useRouter();
  const { products, shelves, ready } = useStore();
  const [sort, setSort] = useState("feat"), [term, setTerm] = useState(q), [open, setOpen] = useState(false), [showSearch, setShowSearch] = useState(Boolean(q));
  const [aud, setAud] = useState(""), [min, setMin] = useState(""), [max, setMax] = useState(""), [avail, setAvail] = useState(false);
  useEffect(() => { setTerm(q); if (q) setShowSearch(true); }, [q]);
  const c = pick ? undefined : CATEGORIES.find((x) => x.slug === cat), s = c?.subs?.find((x) => x.slug === sub), t = q.trim().toLowerCase();
  let list = products.filter((p) => (pick ? p.featured : true) && (!c || p.category === c.slug) && (!s || p.sub === s.slug) && (!t || (p.name + " " + p.brand).toLowerCase().includes(t))
    && (!aud || p.audience === aud) && (!min || fromPrice(p) >= Number(min)) && (!max || fromPrice(p) <= Number(max)) && (!avail || !isOut(p)));
  const key = pick ? "worth" : cat;
  list = sort === "feat" ? rankBy(list, shelves[key]) : [...list].sort((a, b) => sort === "pa" ? fromPrice(a) - fromPrice(b) : sort === "pd" ? fromPrice(b) - fromPrice(a) : sort === "az" ? a.name.localeCompare(b.name) : b.createdAt - a.createdAt);
  const nf = [aud, min, max, avail ? "1" : ""].filter(Boolean).length, reset = () => { setAud(""); setMin(""); setMax(""); setAvail(false); };
  const base = pick ? "/worth-discovering" : "/shop";
  return (
    <div className="wrap">
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / {pick ? <span>Worth Discovering</span> : <><Link href="/shop">Shop</Link>{c && <> / <span>{c.name}</span></>}</>}</nav>
      <h1 className="shophd">{pick ? "Worth Discovering" : s ? s.name : c ? c.name : "All fragrances"}</h1>
      {!pick && <div className="chips sc" role="navigation" aria-label="Categories"><Link replace className={"chip" + (!c ? " on" : "")} href="/shop">All</Link>{CATEGORIES.map((x) => <Link replace key={x.slug} className={"chip" + (c?.slug === x.slug ? " on" : "")} href={`/shop?cat=${x.slug}`}>{x.name}</Link>)}</div>}
      {c?.subs && <div className="chips sc"><Link replace className={"chip" + (!s ? " on" : "")} href={`/shop?cat=${c.slug}`}>All</Link>{c.subs.map((x) => <Link replace key={x.slug} className={"chip" + (s?.slug === x.slug ? " on" : "")} href={`/shop?cat=${c.slug}&sub=${x.slug}`}>{x.name}</Link>)}</div>}
      <div className="toolbar">
        <button className="tb" aria-label="Search" aria-expanded={showSearch} onClick={() => setShowSearch((v) => !v)}><Search size={18} strokeWidth={1.5} /></button>
        <button className="tb grow" onClick={() => setOpen(true)}><SlidersHorizontal size={18} strokeWidth={1.5} />Filter{nf ? ` (${nf})` : ""}</button>
        <label className="sr" htmlFor="so">Sort</label>
        <select id="so" value={sort} onChange={(e) => setSort(e.target.value)}><option value="feat">Featured</option><option value="new">Newest</option><option value="pa">Price: low to high</option><option value="pd">Price: high to low</option><option value="az">Name: A to Z</option></select>
      </div>
      {showSearch && <form onSubmit={(e) => { e.preventDefault(); const u = new URLSearchParams(Object.entries({ cat, sub, q: term }).filter(([, v]) => v && !pick)); router.replace(base + (u.toString() ? "?" + u : "")); }} role="search" style={{ marginBottom: 8 }}><label className="sr" htmlFor="sq">Search products</label><input id="sq" className="in-t" autoFocus={!q} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or brand, then press enter" /></form>}
      <p className="muted small" style={{ margin: "4px 0 8px" }}>{ready ? `${list.length} product${list.length === 1 ? "" : "s"}` : "Loading..."}</p>
      {!ready ? <div className="grid">{[0, 1, 2, 3].map((i) => <div key={i} className="card"><div className="ph" /></div>)}</div>
        : list.length === 0 ? <div style={{ padding: "24px 0" }}><p>No products match your search.</p><Link className="btn o fit" href={base} onClick={reset}>Reset filters</Link></div>
        : <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      <div className="help"><b>Cannot find what you are looking for?</b><p style={{ margin: "0 0 12px" }}>Ask us on WhatsApp and we will help you find it, or build your own combo.</p><div className="row2"><a className="btn sm" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello ScentbyBecca, I am looking for a fragrance.")}`} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a><Link className="btn o sm" href="/combo">Curate a combo</Link></div></div>
      {open && <Sheet title="Filter" onClose={() => setOpen(false)}>
        <label className="lab" htmlFor="fa">For</label><select id="fa" value={aud} onChange={(e) => setAud(e.target.value)}><option value="">Everyone</option><option>Women</option><option>Men</option><option>Unisex</option></select>
        <div className="row2"><div><label className="lab" htmlFor="fmin">Lowest price</label><input id="fmin" className="in-t" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} /></div><div><label className="lab" htmlFor="fmax">Highest price</label><input id="fmax" className="in-t" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} /></div></div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0", minHeight: 44 }}><input type="checkbox" checked={avail} onChange={(e) => setAvail(e.target.checked)} style={{ width: 22, height: 22 }} />Available only</label>
        <div className="row2"><button className="btn o" onClick={reset}>Clear</button><button className="btn" onClick={() => setOpen(false)}>Show {list.length}</button></div>
      </Sheet>}
    </div>
  );
}
