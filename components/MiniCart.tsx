"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Pic } from "./ProductCard";
import { useCart } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ngn } from "@/lib/util";

export default function MiniCart() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useCart();
  const { products } = useStore();
  useEffect(() => { const h = () => setOpen(true); window.addEventListener("sbb-minicart", h); return () => window.removeEventListener("sbb-minicart", h); }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  const lines = cart.map((l) => { const p = products.find((x) => x.id === l.pid), v = p?.variants.find((x) => x.id === l.vid); return { l, p, v }; }).filter((x) => x.p && x.v) as { l: (typeof cart)[0]; p: (typeof products)[0]; v: (typeof products)[0]["variants"][0] }[];
  const sub = lines.reduce((a, { l, v }) => a + l.qty * v.price, 0), close = () => setOpen(false);
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="mini" role="dialog" aria-modal="true" aria-label="Shopping bag">
        <div className="pn-h"><h2>Shopping bag</h2><button className="ib" aria-label="Close shopping bag" onClick={close} autoFocus><X size={24} strokeWidth={1.5} /></button></div>
        <div className="pn-b">
          {lines.length === 0 ? <p className="muted">Your bag is empty.</p> : lines.map(({ l, p, v }) => (
            <div className="mini-i" key={l.pid + l.vid}>
              <Pic p={p} />
              <div><Link href={`/products/${p.slug}`} onClick={close} style={{ font: "600 18px var(--display)", textDecoration: "none" }}>{p.name}</Link><div className="muted small">{v.label ? `${v.label} | ` : ""}{l.qty} x {ngn(v.price)}</div></div>
              <button className="ib" aria-label={`Remove ${p.name}`} onClick={() => setCart((c) => c.filter((x) => !(x.pid === l.pid && x.vid === l.vid)))}><Trash2 size={18} strokeWidth={1.5} /></button>
            </div>
          ))}
        </div>
        <div className="pn-f" style={{ gridTemplateColumns: "1fr" }}>
          <p style={{ display: "flex", justifyContent: "space-between", margin: 0, font: "600 20px var(--display)" }}><span>Subtotal</span><span>{ngn(sub)}</span></p>
          <p className="hint" style={{ margin: 0 }}>Delivery and any offer are worked out at checkout.</p>
          <Link className="btn" href="/cart" onClick={close}>Checkout</Link>
          <button className="btn o" onClick={close}>Continue shopping</button>
        </div>
      </aside>
    </>
  );
}
