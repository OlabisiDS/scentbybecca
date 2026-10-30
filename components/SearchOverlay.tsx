"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Pic } from "./ProductCard";
import { useStore } from "@/lib/store";
import { fromPrice } from "@/lib/types";
import { ngn } from "@/lib/util";

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter(), { products } = useStore(), [q, setQ] = useState("");
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  const t = q.trim().toLowerCase(), hits = t.length < 2 ? [] : products.filter((p) => (p.name + " " + p.brand).toLowerCase().includes(t)).slice(0, 6);
  return (
    <>
      <div className="scrim" style={{ zIndex: 65 }} onClick={onClose} />
      <div className="srch" role="dialog" aria-modal="true" aria-label="Search">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="eyebrow">Search the collection</span><button className="ib" aria-label="Close search" onClick={onClose}><X size={22} strokeWidth={1.5} /></button></div>
        <form role="search" onSubmit={(e) => { e.preventDefault(); onClose(); router.push("/shop?q=" + encodeURIComponent(q)); }}>
          <label className="sr" htmlFor="gs">Search</label><input id="gs" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search" autoComplete="off" />
        </form>
        {t.length >= 2 && (hits.length === 0 ? <p className="muted">No matches. Press enter to search the whole shop.</p> : <>{hits.map((p) => <Link key={p.id} href={`/products/${p.slug}`} onClick={onClose}><Pic p={p} /><span style={{ font: "600 18px var(--display)" }}>{p.name}</span><span className="muted">{ngn(fromPrice(p))}</span></Link>)}<p style={{ marginTop: 10 }}><Link href={"/shop?q=" + encodeURIComponent(q)} onClick={onClose} style={{ display: "inline", border: 0 }}>See all results</Link></p></>)}
      </div>
    </>
  );
}
