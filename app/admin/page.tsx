/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { Pic } from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { fromPrice } from "@/lib/types";
import { ngn } from "@/lib/util";

export default function Dashboard() {
  const { api, summary } = useAdmin();
  const [items, setItems] = useState<Product[] | null>(null);
  useEffect(() => { api("products").then((j) => setItems(j.items)).catch(() => setItems([])); }, [api]);
  const c = (f: (p: Product) => boolean) => (items || []).filter(f).length;
  return (
    <>
      <h1>Welcome back</h1>
      <div className="stats2">
        <Link href="/admin/orders" className={"stat" + (summary.ordersToCheck ? " hot" : "")}><b>{summary.ordersToCheck}</b>Orders to check</Link>
        <Link href="/admin/reviews" className={"stat" + (summary.pendingReviews ? " hot" : "")}><b>{summary.pendingReviews}</b>Reviews to approve</Link>
        <Link href="/admin/products" className="stat"><b>{summary.outOfStock}</b>Out of stock</Link>
        <Link href="/admin/products" className="stat"><b>{c((p) => p.status === "active")}</b>Products live</Link>
      </div>
      <div className="row2" style={{ maxWidth: 560 }}><Link className="btn" href="/admin/edit/new"><Plus size={18} />Add New Perfume</Link><Link className="btn o" href="/admin/tools">Import products</Link></div>
      <h2 style={{ fontSize: 18, margin: "24px 0 10px" }}>Recently updated</h2>
      {items === null ? <p className="muted">Loading...</p> : items.length === 0 ? <p>No products yet. Add your first perfume.</p> : items.slice(0, 5).map((p) => (
        <Link key={p.id} href={`/admin/edit/${p.id}`} className="arow" style={{ textDecoration: "none" }}><Pic p={p} /><div><b>{p.name}</b><div className="small muted">{ngn(fromPrice(p))} | {p.status === "active" ? "Live" : p.status === "draft" ? "Draft" : "Hidden"}</div></div></Link>
      ))}
    </>
  );
}
