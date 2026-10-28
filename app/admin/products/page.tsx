/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { Pic } from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/config";
import { Product, fromPrice, isOut } from "@/lib/types";
import { ngn } from "@/lib/util";

export default function Products() {
  const { api, refresh } = useAdmin();
  const [items, setItems] = useState<Product[] | null>(null), [q, setQ] = useState(""), [st, setSt] = useState(""), [msg, setMsg] = useState("");
  const load = useCallback(() => api("products").then((j) => setItems(j.items)).catch((e) => setMsg(e.message)), [api]);
  useEffect(() => { load(); }, [load]);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  const save = async (p: Product, patch: Partial<Product>, m: string) => { try { await api("products", { method: "POST", body: { ...p, ...patch } }); flash(m); load(); refresh(); } catch (e) { flash((e as Error).message); } };
  const del = async (p: Product) => { if (!confirm(`Permanently delete "${p.name}"? This cannot be undone. To keep it for later, use Hide from store instead.`)) return; try { await api("products", { method: "DELETE", query: `id=${p.id}` }); flash("Product deleted."); load(); } catch (e) { flash((e as Error).message); } };
  const list = (items || []).filter((p) => (!st || p.status === st) && (!q || (p.name + " " + p.brand).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}><h1 style={{ margin: 0 }}>Products</h1><Link className="btn fit" href="/admin/edit/new"><Plus size={18} />Add New Perfume</Link></div>
      {msg && <div className="fb" role="status">{msg}</div>}
      <div className="row2" style={{ marginBottom: 12 }}><div><label className="sr" htmlFor="aq">Search</label><input id="aq" className="in-t" placeholder="Search name or brand" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label="Filter by status" value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option><option value="active">Live</option><option value="draft">Draft</option><option value="archived">Hidden</option></select></div>
      {items === null ? <p className="muted">Loading...</p> : list.length === 0 ? <p>No products found.</p> : list.map((p) => (
        <article className="arow" key={p.id}>
          <Pic p={p} />
          <div>
            <b>{p.name}</b>
            <div className="muted small">{p.brand} | {CATEGORIES.find((c) => c.slug === p.category)?.name}</div>
            <div className="small">{p.variants.length > 1 ? `From ${ngn(fromPrice(p))}, ${p.variants.length} sizes` : ngn(fromPrice(p))} <span className={"tag " + (p.status === "active" ? "g" : "")}>{p.status === "active" ? "Live" : p.status === "draft" ? "Draft" : "Hidden"}</span> {isOut(p) && <span className="tag r">Out of stock</span>}</div>
            <div className="acts">
              <Link className="btn o sm fit" href={`/admin/edit/${p.id}`}>Edit</Link>
              {p.status === "active" ? <button className="btn o sm fit" onClick={() => save(p, { status: "archived" }, "Product hidden from the store.")}>Hide from store</button> : <button className="btn o sm fit" onClick={() => save(p, { status: "active" }, "Product is now live.")}>Publish</button>}
              <button className="btn o sm fit" onClick={() => save(p, { variants: p.variants.map((v) => ({ ...v, available: isOut(p) })) }, isOut(p) ? "Back in stock." : "Marked out of stock.")}>{isOut(p) ? "Back in stock" : "Mark out of stock"}</button>
              <Link className="btn o sm fit" href={`/admin/edit/new?from=${p.id}`}>Duplicate</Link>
              <button className="btn red sm fit" onClick={() => del(p)}>Delete</button>
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
