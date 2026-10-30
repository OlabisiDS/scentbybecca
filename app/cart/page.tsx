"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Pic } from "@/components/ProductCard";
import { bestPromo, buildMessage, calc } from "@/lib/calc";
import { useCart, useRecent } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ngn, waLink } from "@/lib/util";

export default function CartPage() {
  const router = useRouter();
  const { products, zones, promos, orders, ready } = useStore();
  const [cart, setCart] = useCart();
  const [, setRecent] = useRecent();
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", notes: "", zoneId: "", areaId: "", requestedArea: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const lines = cart.map((l) => { const p = products.find((x) => x.id === l.pid), v = p?.variants.find((x) => x.id === l.vid); return { l, p, v }; }).filter((x) => x.p && x.v && x.v.available) as { l: (typeof cart)[0]; p: (typeof products)[0]; v: (typeof products)[0]["variants"][0] }[];
  const sub = lines.reduce((a, { l, v }) => a + l.qty * v.price, 0);
  const zone = zones.find((z) => z.id === f.zoneId), areas = zone?.areas || [], area = areas.find((a) => a.id === f.areaId), unlisted = areas.length > 0 && f.areaId === "other";
  const fee: number | null = zone ? (areas.length ? (area ? (area.fee ?? zone.fee) : null) : zone.fee) : null;
  const promo = bestPromo(promos), t = calc(sub, promo?.discountPercent || 0, fee);
  const view = () => ({ items: lines.map(({ l, p, v }) => ({ name: p.name, variant: v.label, qty: l.qty, price: v.price })), subtotal: sub, discount: t.discount, discountPercent: promo?.discountPercent || 0, promoTitle: promo?.headline || "", zone: zone?.name || "Other location", area: area?.name || "", requestedArea: unlisted ? f.requestedArea : "", deliveryFee: fee, name: f.name.trim() || undefined, phone: f.phone.trim() || undefined, address: f.address.trim() || undefined });
  const upd = (pid: string, vid: string, q: number) => setCart((c) => c.map((x) => (x.pid === pid && x.vid === vid ? { ...x, qty: Math.max(1, Math.min(20, q)) } : x)));
  const wa = () => window.open(waLink(buildMessage(view())), "_blank", "noopener,noreferrer");
  const place = async () => {
    if (!f.name.trim() || !f.phone.trim() || !f.address.trim()) { setErr("Please enter your name, phone number and delivery address."); return; }
    if (areas.length && !area && !(unlisted && f.requestedArea.trim().length >= 2)) { setErr("Please choose your area, or type it if it is not on the list."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, phone: f.phone, email: f.email, address: f.address, notes: f.notes, zoneId: f.zoneId || null, areaId: area?.id || null, requestedArea: unlisted ? f.requestedArea : "", items: lines.map(({ l }) => l) }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Could not place the order.");
      setRecent((x) => [{ id: j.id, number: j.number, at: Date.now() }, ...x].slice(0, 10));
      setCart([]); router.push(`/orders/${j.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  if (!ready) return <div className="wrap pad muted">Loading...</div>;
  if (lines.length === 0) return <><PageHeader title="Your cart" pageKey="cart" steps={0} /><div className="wrap pad"><p className="muted">Your cart is empty.</p><div className="row2" style={{ maxWidth: 420 }}><Link className="btn" href="/shop">Continue shopping</Link><Link className="btn o" href="/orders">Track an order</Link></div></div></>;
  return (
    <>
      <PageHeader title="Checkout" pageKey="cart" steps={1} />
    <div className="wrap pad">
      {lines.map(({ l, p, v }) => (
        <div className="line" key={l.pid + l.vid}>
          <Pic p={p} />
          <div>
            <Link href={`/products/${p.slug}`} style={{ fontWeight: 600, textDecoration: "none" }}>{p.name}</Link>
            <div className="muted small">{v.label} {v.label && "| "}{ngn(v.price)} each</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0", flexWrap: "wrap" }}>
              <div className="qty"><button aria-label="Decrease quantity" onClick={() => upd(l.pid, l.vid, l.qty - 1)}><Minus size={16} /></button><span>{l.qty}</span><button aria-label="Increase quantity" onClick={() => upd(l.pid, l.vid, l.qty + 1)}><Plus size={16} /></button></div>
              <button className="ib" aria-label={`Remove ${p.name}`} onClick={() => setCart((c) => c.filter((x) => !(x.pid === l.pid && x.vid === l.vid)))}><Trash2 size={20} strokeWidth={1.5} /></button>
            </div>
            <b>{ngn(l.qty * v.price)}</b>
          </div>
        </div>
      ))}
      <h2 style={{ fontSize: 18, margin: "20px 0 0" }}>Delivery details</h2>
      <label className="lab" htmlFor="n">Full name</label><input id="n" className="in-t" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
      <label className="lab" htmlFor="ph">Phone number</label><input id="ph" className="in-t" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" />
      <label className="lab" htmlFor="em">Email (optional, for order updates)</label><input id="em" className="in-t" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
      <label className="lab" htmlFor="zn">Delivery location</label>
      <select id="zn" value={f.zoneId} onChange={(e) => setF({ ...f, zoneId: e.target.value, areaId: "", requestedArea: "" })}><option value="">Other location (fee confirmed on WhatsApp)</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}{z.areas.length ? "" : ` (${ngn(z.fee)} delivery)`}</option>)}</select>
      {areas.length > 0 && <>
        <label className="lab" htmlFor="ar">Your area in {zone!.name}</label>
        <select id="ar" value={f.areaId} onChange={(e) => setF({ ...f, areaId: e.target.value })}><option value="">Choose your area</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({ngn(a.fee ?? zone!.fee)} delivery)</option>)}<option value="other">My area is not on this list</option></select>
        {unlisted && <><label className="lab" htmlFor="ra">Type your area</label><input id="ra" className="in-t" value={f.requestedArea} onChange={(e) => setF({ ...f, requestedArea: e.target.value })} /><p className="hint">We will confirm the delivery fee for your area on WhatsApp.</p></>}
      </>}
      <label className="lab" htmlFor="ad">Full delivery address, city and state</label><textarea id="ad" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} autoComplete="street-address" />
      <label className="lab" htmlFor="no">Order notes (optional)</label><input id="no" className="in-t" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <div style={{ margin: "18px 0 6px", display: "grid", gap: 4 }}>
        <p style={{ display: "flex", justifyContent: "space-between", margin: 0 }}><span>Product subtotal</span><span>{ngn(sub)}</span></p>
        {t.discount > 0 && <p style={{ display: "flex", justifyContent: "space-between", margin: 0, color: "var(--green)" }}><span>Discount ({promo!.discountPercent}% off)</span><span>-{ngn(t.discount)}</span></p>}
        <p style={{ display: "flex", justifyContent: "space-between", margin: 0 }}><span>Delivery</span><span>{fee === null ? "Confirmed on WhatsApp" : ngn(fee)}</span></p>
        <p style={{ display: "flex", justifyContent: "space-between", margin: 0, fontSize: 18, fontWeight: 600 }}><span>{fee === null ? "To pay now (items)" : "Total payable"}</span><span>{ngn(t.items + (fee ?? 0))}</span></p>
        {fee === null && <p className="muted small" style={{ margin: 0 }}>This is provisional. You pay for your items now. ScentbyBecca confirms your delivery fee on WhatsApp after you order.</p>}
      </div>
      <h2 style={{ fontSize: 18, margin: "18px 0 8px" }}>Payment</h2>
      <div className="pm-opt on"><b>Bank transfer</b><div className="small muted">Place your order, then transfer the amount shown to Becca&apos;s account. Your bank details appear right after you order.</div></div>
      <div className="pm-opt off" aria-disabled="true"><b>Pay online with card</b> <span className="tag">Temporarily unavailable</span><div className="small muted">Online card payment is not open yet. Please use bank transfer for now.</div></div>
      {orders.paused && <p className="warn">{orders.message || "Orders are paused right now. Please check back soon."}</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <div style={{ marginTop: 16, display: "grid", gap: 10 }}><button className="btn" onClick={place} disabled={busy || orders.paused}>{busy ? "Placing order..." : "Place order"}</button><button className="btn o" onClick={wa}>Send my cart list on WhatsApp</button><Link className="btn o" href="/shop">Continue shopping</Link><Link href="/orders" style={{ textAlign: "center", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>Already ordered? Track your order</Link></div>
      <p className="small muted">Placing an order does not charge you. Only send money to the account shown on your order page.</p>
    </div></>
  );
}
