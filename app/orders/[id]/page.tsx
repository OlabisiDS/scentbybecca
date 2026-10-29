"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { buildMessage } from "@/lib/calc";
import { useRecent } from "@/lib/hooks";
import { Order, STATUS_LABEL } from "@/lib/types";
import { ngn, waLink } from "@/lib/util";

type Bk = { id: string; bank: string; name: string; number: string };
const stage = (o: Order) => (o.status === "delivered" ? 4 : o.status === "dispatched" ? 3 : o.status === "paid" ? 2 : o.paidClaimed ? 1 : 0);
const STEPS = ["Order received", "Payment reported", "Payment confirmed", "Dispatched", "Delivered"];
export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [, setRecent] = useRecent();
  const [o, setO] = useState<Order | null>(null), [banks, setBanks] = useState<Bk[]>([]), [state, setState] = useState<"load" | "ok" | "none">("load"), [copied, setCopied] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await fetch(`/api/orders/${id}`); if (!r.ok) { setState("none"); return; }
    const j = await r.json(); setO(j.order); setBanks(j.banks); setState("ok");
    setRecent((x) => (x.some((y) => y.id === j.order.id) ? x : [{ id: j.order.id, number: j.order.number, at: Date.now() }, ...x].slice(0, 10)));
  }, [id, setRecent]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  if (state === "load") return <div className="wrap pad muted">Loading...</div>;
  if (state === "none" || !o) return <div className="wrap pad"><h1 style={{ fontSize: 24 }}>Order not found</h1><Link className="btn fit" href="/orders">Track an order</Link></div>;
  const upfront = o.subtotal - o.discount + (o.feePending ? 0 : (o.deliveryFee ?? 0)), at = stage(o), total = o.subtotal - o.discount + (o.deliveryFee ?? 0);
  const claim = async () => {
    setBusy(true); setErr("");
    try { const r = await fetch(`/api/orders/${o.id}/claim`, { method: "POST" }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "We could not record your notification."); await load(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const copy = (t: string, k: string) => { navigator.clipboard?.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); };
  const waMsg = buildMessage({ number: o.number, items: o.items, subtotal: o.subtotal, discount: o.discount, discountPercent: o.discountPercent, promoTitle: o.promoTitle, zone: o.zone, area: o.area, requestedArea: o.requestedArea, deliveryFee: o.deliveryFee, name: o.name, phone: o.phone, address: o.address, notes: o.notes, paymentReported: o.paidClaimed });
  return (
    <div className="wrap pad">
      <h1 style={{ fontSize: 24 }}>Order {o.number}</h1>
      <div className="warn" style={{ background: "#fff" }}><b>Your order reference: {o.number}</b> <button className="btn o sm fit" style={{ marginLeft: 8 }} onClick={() => copy(o.number, "ref")}>{copied === "ref" ? "Copied" : "Copy"}</button>
        <div className="small" style={{ marginTop: 6 }}>Use this reference with your phone number on the <Link href="/orders">Track your order</Link> page at any time. This page also stays available at its link{o.email ? ", and we have emailed it to you" : ""}.</div></div>
      {o.status === "cancelled" ? <p className="tag r">Cancelled</p> : STEPS.map((s, i) => <div key={s} className={"step" + (i <= at ? " on" : "")}><span className="dot" aria-hidden="true" />{s}{i === at && " (current)"}</div>)}
      {o.status === "awaiting_payment" && !o.paidClaimed && (
        <div className="warn" style={{ background: "#fff" }}>
          <b>Pay {ngn(upfront)} by bank transfer to secure your order</b>
          {banks.map((b) => (
            <div key={b.id} style={{ margin: "12px 0" }}>
              <div>{b.bank}</div><div><b>{b.name}</b></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><span style={{ fontSize: 22, letterSpacing: ".06em" }}>{b.number}</span><button className="btn o sm fit" onClick={() => copy(b.number, b.id)}>{copied === b.id ? "Copied" : "Copy number"}</button></div>
            </div>
          ))}
          <p className="small">Use {o.number} as the transfer narration. Check that the account name matches the one above before you send. ScentbyBecca will never ask you to pay to different details in chat.</p>
          {o.feePending && <p className="small">Delivery fee for your location will be confirmed by ScentbyBecca on WhatsApp. It is not included in the amount above.</p>}
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" onClick={claim} disabled={busy}>{busy ? "Sending..." : err ? "Try again" : "I have paid"}</button>
        </div>
      )}
      {o.status === "awaiting_payment" && o.paidClaimed && (
        <div className="fb" role="status" style={{ padding: 14 }}>
          <b>Your payment notification has been received by ScentbyBecca.</b>
          <p style={{ margin: "8px 0" }}>Our team will review your payment and contact you if any further information is needed.</p>
          <p style={{ margin: 0 }}>Your order reference is <b>{o.number}</b>. You can use it to check your order status at any time from the Track your order page.</p>
        </div>
      )}
      {o.status === "paid" && <p className="fb">Your payment has been confirmed. We are preparing your order.</p>}
      {o.feePending && o.deliveryFee !== null && o.status !== "cancelled" && <p className="warn">Delivery fee confirmed: <b>{ngn(o.deliveryFee)}</b>. Please pay this to the same account and tell us on WhatsApp.</p>}
      <h2 style={{ fontSize: 18, margin: "20px 0 8px" }}>Items</h2>
      {o.items.map((i) => <p key={i.pid + i.vid} style={{ margin: "0 0 6px" }}>{i.qty} x {i.name}{i.variant ? ` (${i.variant})` : ""} <span className="muted">{ngn(i.qty * i.price)}</span></p>)}
      <p style={{ margin: "12px 0 0" }}>Product subtotal: {ngn(o.subtotal)}</p>
      {o.discount > 0 && <p style={{ margin: 0 }}>Discount ({o.discountPercent}% off): -{ngn(o.discount)}</p>}
      <p style={{ margin: 0 }}>Delivery ({o.zone}{o.area ? `, ${o.area}` : o.requestedArea ? `, ${o.requestedArea}` : ""}): {o.deliveryFee === null ? "to be confirmed on WhatsApp" : ngn(o.deliveryFee)}</p>
      <p style={{ margin: "6px 0 0", fontWeight: 600, fontSize: 18 }}>{o.deliveryFee === null ? `Provisional total: ${ngn(o.subtotal - o.discount)} plus delivery` : `Total: ${ngn(total)}`}</p>
      <div style={{ display: "grid", gap: 10, maxWidth: 360, marginTop: 16 }}>
        <a className="btn" href={waLink(waMsg)} target="_blank" rel="noopener noreferrer">Send this order on WhatsApp</a>
        <Link className="btn o" href="/orders">Track another order</Link><Link className="btn o" href="/shop">Continue shopping</Link>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Status: {STATUS_LABEL[o.status]}</p>
    </div>
  );
}
