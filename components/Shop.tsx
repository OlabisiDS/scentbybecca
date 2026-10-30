"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Search, SlidersHorizontal, Square } from "lucide-react";
import PageHeader from "./PageHeader";
import Panel from "./Panel";
import ProductCard from "./ProductCard";
import { CATEGORIES, WHATSAPP_NUMBER } from "@/lib/config";
import { useStore } from "@/lib/store";
import { fromPrice, isOut } from "@/lib/types";
import { rankBy } from "@/lib/util";

const SORTS: [string, string][] = [["feat", "Featured"], ["new", "Latest"], ["pa", "Price: low to high"], ["pd", "Price: high to low"], ["az", "Name: A to Z"]];
export default function Shop({ cat, sub, q, pick }: { cat: string; sub: string; q: string; pick?: "worth" }) {
  const router = useRouter();
  const { products, shelves, covers, ready } = useStore();
  const [sort, setSort] = useState("feat"), [term, setTerm] = useState(q), [fOpen, setF] = useState(false), [sOpen, setS] = useState(false), [showSearch, setShowSearch] = useState(Boolean(q)), [cols, setCols] = useState<1 | 2>(2);
  const [aud, setAud] = useState(""), [min, setMin] = useState(""), [max, setMax] = useState(""), [avail, setAvail] = useState(false);
  useEffect(() => { setTerm(q); if (q) setShowSearch(true); }, [q]);
  const c = pick ? undefined : CATEGORIES.find((x) => x.slug === cat), s = c?.subs?.find((x) => x.slug === sub), t = q.trim().toLowerCase();
  let list = products.filter((p) => (pick ? p.featured : true) && (!c || p.category === c.slug) && (!s || p.sub === s.slug) && (!t || (p.name + " " + p.brand).toLowerCase().includes(t))
    && (!aud || p.audience === aud) && (!min || fromPrice(p) >= Number(min)) && (!max || fromPrice(p) <= Number(max)) && (!avail || !isOut(p)));
  const key = pick ? "worth" : cat;
  list = sort === "feat" ? rankBy(list, shelves[key]) : [...list].sort((a, b) => sort === "pa" ? fromPrice(a) - fromPrice(b) : sort === "pd" ? fromPrice(b) - fromPrice(a) : sort === "az" ? a.name.localeCompare(b.name) : b.createdAt - a.createdAt);
  const nf = [aud, min, max, avail ? "1" : ""].filter(Boolean).length, reset = () => { setAud(""); setMin(""); setMax(""); setAvail(false); };
  const base = pick ? "/worth-discovering" : "/shop", title = pick ? "Worth Discovering" : s ? s.name : c ? c.name : "All fragrances";
  return (
    <>
      <PageHeader title={title} pageKey={pick ? "worth" : "shop"} image={c ? covers[c.slug]?.[0] : undefined} crumb={pick ? "Worth Discovering" : c ? "Shop" : "Shop"} />
      <div className="wrap">
        {c?.subs && <div className="chips sc" style={{ marginTop: 12 }}><Link replace className={"chip" + (!s ? " on" : "")} href={`/shop?cat=${c.slug}`}>All</Link>{c.subs.map((x) => <Link replace key={x.slug} className={"chip" + (s?.slug === x.slug ? " on" : "")} href={`/shop?cat=${c.slug}&sub=${x.slug}`}>{x.name}</Link>)}</div>}
        <p className="count" style={{ margin: "14px 0 0" }}>{ready ? `Showing ${list.length} result${list.length === 1 ? "" : "s"}` : "Loading..."}</p>
        <div className="shtool">
          <button className={nf ? "on" : ""} onClick={() => setF(true)}><SlidersHorizontal size={17} strokeWidth={1.5} />Filter{nf ? ` (${nf})` : ""}</button>
          <button onClick={() => setS(true)}>Sort by {SORTS.find((x) => x[0] === sort)![1]}</button>
          <span style={{ display: "flex" }}>
            <button aria-label="Search" onClick={() => setShowSearch((v) => !v)}><Search size={17} strokeWidth={1.5} /></button>
            <button aria-label="Two columns" aria-pressed={cols === 2} className={cols === 2 ? "on" : ""} onClick={() => setCols(2)}><LayoutGrid size={17} strokeWidth={1.5} /></button>
            <button aria-label="One column" aria-pressed={cols === 1} className={cols === 1 ? "on" : ""} onClick={() => setCols(1)}><Square size={17} strokeWidth={1.5} /></button>
          </span>
        </div>
        {showSearch && <form onSubmit={(e) => { e.preventDefault(); const u = new URLSearchParams(Object.entries({ cat, sub, q: term }).filter(([, v]) => v && !pick)); router.replace(base + (u.toString() ? "?" + u : "")); }} role="search" style={{ marginBottom: 10 }}><label className="sr" htmlFor="sq">Search products</label><input id="sq" className="in-t" autoFocus={!q} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or brand, then press enter" /></form>}
        {!ready ? <div className={"grid" + (cols === 1 ? " one" : "")}>{[0, 1, 2, 3].map((i) => <div key={i} className="card"><div className="ph" /></div>)}</div>
          : list.length === 0 ? <div style={{ padding: "24px 0" }}><p>No products match your search.</p><Link className="btn o fit" href={base} onClick={reset}>Reset filters</Link></div>
          : <div className={"grid" + (cols === 1 ? " one" : "")}>{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        <div className="help"><b>Cannot find what you are looking for?</b><p style={{ margin: "0 0 12px" }}>Ask us on WhatsApp and we will help you find it, or build your own combo.</p><div className="row2"><a className="btn sm" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello ScentbyBecca, I am looking for a fragrance.")}`} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a><Link className="btn o sm" href="/combo">Curate a combo</Link></div></div>
      </div>
      {fOpen && <Panel title="Filter" onClose={() => setF(false)} footer={<><button className="btn o" onClick={reset}>Clear</button><button className="btn" onClick={() => setF(false)}>Show {list.length} results</button></>}>
        {!pick && <div className="pn-sec"><b>Category</b>
          <Link replace className={"pn-opt" + (!c ? " on" : "")} href="/shop" onClick={() => setF(false)}><i />All fragrances</Link>
          {CATEGORIES.map((x) => <Link replace key={x.slug} className={"pn-opt" + (c?.slug === x.slug ? " on" : "")} href={`/shop?cat=${x.slug}`} onClick={() => setF(false)}><i />{x.name}</Link>)}</div>}
        <div className="pn-sec"><b>For</b>{["", "Women", "Men", "Unisex"].map((a) => <button key={a} className={"pn-opt" + (aud === a ? " on" : "")} style={{ background: "none", border: 0, width: "100%", textAlign: "left" }} onClick={() => setAud(a)}><i />{a || "Everyone"}</button>)}</div>
        <div className="pn-sec"><b>Price</b><div className="row2"><div><label className="sr" htmlFor="fmin">Lowest price</label><input id="fmin" className="in-t" placeholder="Lowest" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} /></div><div><label className="sr" htmlFor="fmax">Highest price</label><input id="fmax" className="in-t" placeholder="Highest" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} /></div></div></div>
        <div className="pn-sec"><label className="pn-opt"><input type="checkbox" checked={avail} onChange={(e) => setAvail(e.target.checked)} style={{ width: 20, height: 20 }} />Available only</label></div>
      </Panel>}
      {sOpen && <Panel title="Sort by" onClose={() => setS(false)}><div className="pn-sec" style={{ borderBottom: 0 }}>{SORTS.map(([k, label]) => <button key={k} className={"pn-opt" + (sort === k ? " on" : "")} style={{ background: "none", border: 0, width: "100%", textAlign: "left" }} onClick={() => { setSort(k); setS(false); }}><i />{label}</button>)}</div></Panel>}
    </>
  );
}
