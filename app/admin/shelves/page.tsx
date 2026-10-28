/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { CATEGORIES } from "@/lib/config";
import type { Product } from "@/lib/types";
import { rankBy } from "@/lib/util";

export default function Shelves() {
  const { api } = useAdmin();
  const [products, setProducts] = useState<Product[] | null>(null), [shelves, setShelves] = useState<Record<string, string[]>>({}), [shelf, setShelf] = useState("worth"), [msg, setMsg] = useState("");
  useEffect(() => { api("products").then((j) => setProducts(j.items)); api("shelves").then((j) => setShelves(Object.fromEntries(j.items.map((x: any) => [x.key, x.ids])))); }, [api]);
  if (!products) return <p className="muted">Loading...</p>;
  const base = products.filter((p) => p.status === "active" && (shelf === "worth" ? p.featured : p.category === shelf)), list = rankBy(base, shelves[shelf]);
  const move = async (i: number, d: number) => {
    const ids = list.map((p) => p.id), j = i + d; if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]]; setShelves((s) => ({ ...s, [shelf]: ids }));
    try { await api("shelves", { method: "PUT", body: { key: shelf, ids } }); setMsg("Order saved."); setTimeout(() => setMsg(""), 1500); } catch (e) { setMsg((e as Error).message); }
  };
  return (
    <>
      <h1>Shelf order</h1>
      <p className="muted small">Choose which products come first. New products do not push your chosen order around.</p>
      <label className="lab" htmlFor="sh">Section</label>
      <select id="sh" value={shelf} onChange={(e) => setShelf(e.target.value)}><option value="worth">Worth Discovering (home page)</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
      {msg && <div className="fb" role="status">{msg}</div>}
      <div style={{ marginTop: 14 }}>{list.length === 0 ? <p>No live products in this section yet.</p> : list.map((p, i) => (
        <div key={p.id} className="arow" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
          <b>{i + 1}. {p.name}</b>
          <div className="acts" style={{ margin: 0 }}><button className="btn o sm fit" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={18} /></button><button className="btn o sm fit" aria-label={`Move ${p.name} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown size={18} /></button></div>
        </div>))}</div>
    </>
  );
}
