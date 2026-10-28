"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Order, STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { ngn, waLink } from "@/lib/util";

const STEPS: OrderStatus[] = ["awaiting_payment", "paid", "dispatched", "delivered"];
type Bk = { id: string; bank: string; name: string; number: string };
export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null), [banks, setBanks] = useState<Bk[]>([]), [state, setState] = useState<"load" | "ok" | "none">("load"), [copied, setCopied] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(`/api/orders/${id}`); if (!r.ok) { setState("none"); return; }
    const j = await r.json(); setO(j.order); setBanks(j.banks); setState("ok");
  }, [id]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  if (state === "load") return <div className="wrap pad muted">Loading...</div>;
  if (state === "none" || !o) return <div className="wrap pad"><h1 style={{ fontSize: 26 }}>Order not found</h1><Link className="btn fit" href="/orders">Track an order</Link></div>;
  const pending = o.zone === "Other location", upfront = pending ? o.subtotal : o.subtotal + (o.deliveryFee ?? 0), at = STEPS.indexOf(o.status);
  const claim = async () => { await fetch(`/api/orders/${o.id}/claim`, { method: "POST" }); load(); };
  return (
    <div className="wrap pad">
      <h1 style={{ fontSize: 26 }}>Order {o.number}</h1>
      <p className="small muted">Keep this page or your order number to check your order later.</p>
      {o.status === "cancelled" ? <p className="tag r">Cancelled</p> : STEPS.map((s, i) => <div key={s} className={"step" + (i <= at ? " on" : "")}><span className="dot" aria-hidden="true" />{STATUS_LABEL[s]}{i === at && " (current)"}</div>)}
      {o.status === "awaiting_payment" && (
        <div className="warn" style={{ background: "#fff" }}>
          <b>Pay {ngn(upfront)} by bank transfer to secure your order</b>
          {banks.map((b) => (
            <div key={b.id} style={{ margin: "12px 0" }}>
              <div>{b.bank}</div><div><b>{b.name}</b></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><span style={{ fontSize: 22, letterSpacing: ".06em" }}>{b.number}</span><button className="btn o sm fit" onClick={() => { navigator.clipboard?.writeText(b.number); setCopied(b.id); }}>{copied === b.id ? "Copied" : "Copy number"}</button></div>
            </div>
          ))}
          <p className="small">Use {o.number} as the transfer narration. Check that the account name matches the one above before you send. ScentbyBecca will never ask you to pay to different details in chat.</p>
          {pending && <p className="small">Delivery fee for your location will be confirmed by ScentbyBecca on WhatsApp. It is not included in the amount above.</p>}
          {o.paidClaimed ? <p className="fb">Thank you. Becca will confirm your payment once she sees it in her account.</p> : <button className="btn" onClick={claim}>I have paid</button>}
        </div>
      )}
      {pending && o.deliveryFee !== null && o.status !== "cancelled" && <p className="warn">Delivery fee confirmed: <b>{ngn(o.deliveryFee)}</b>. Please pay this to the same account and tell us on WhatsApp.</p>}
      <h2 style={{ fontSize: 20, margin: "20px 0 8px" }}>Items</h2>
      {o.items.map((i) => <p key={i.pid + i.vid} style={{ margin: "0 0 6px" }}>{i.qty} x {i.name}{i.variant ? ` (${i.variant})` : ""} <span className="muted">{ngn(i.qty * i.price)}</span></p>)}
      <p style={{ margin: "12px 0 0" }}>Subtotal: {ngn(o.subtotal)}</p>
      <p style={{ margin: 0 }}>Delivery to {o.zone}: {pending ? (o.deliveryFee === null ? "to be confirmed on WhatsApp" : ngn(o.deliveryFee)) : ngn(o.deliveryFee ?? 0)}</p>
      <div style={{ display: "grid", gap: 10, maxWidth: 360, marginTop: 16 }}>
        <a className="btn" href={waLink(`Hello ScentbyBecca, this is my order ${o.number} (${o.name}, ${o.phone}). Delivery to: ${o.address}.${o.status === "awaiting_payment" && o.paidClaimed ? " I have made the payment." : ""}`)} target="_blank" rel="noopener noreferrer">Send this order on WhatsApp</a>
        <Link className="btn o" href="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}
