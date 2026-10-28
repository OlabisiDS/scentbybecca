/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/AdminShell";
import { Order, STATUS_LABEL, orderTotal, type OrderStatus } from "@/lib/types";
import { ngn, waPhone } from "@/lib/util";

const NEXT: Partial<Record<OrderStatus, [OrderStatus, string]>> = { awaiting_payment: ["paid", "Mark as paid"], paid: ["dispatched", "Mark as dispatched"], dispatched: ["delivered", "Mark as delivered"] };
export default function Orders() {
  const { api, refresh } = useAdmin();
  const [items, setItems] = useState<Order[] | null>(null), [fees, setFees] = useState<Record<string, string>>({}), [msg, setMsg] = useState("");
  const load = useCallback(() => api("orders").then((j) => setItems(j.items)).catch((e) => setMsg(e.message)), [api]);
  useEffect(() => { load(); api("orders-seen", { method: "PATCH", body: {} }).then(refresh).catch(() => {}); }, [load, api, refresh]);
  const patch = async (id: string, body: object, m: string) => { try { await api("orders", { method: "PATCH", body: { id, ...body } }); setMsg(m); setTimeout(() => setMsg(""), 3000); load(); refresh(); } catch (e) { setMsg((e as Error).message); } };
  return (
    <>
      <h1>Orders</h1>
      <p className="warn">Only mark an order as paid after you have seen the money in your own bank app. A customer&apos;s screenshot is not proof.</p>
      {msg && <div className="fb" role="status">{msg}</div>}
      {items === null ? <p className="muted">Loading...</p> : items.length === 0 ? <p>No orders yet.</p> : items.map((o) => (
        <article key={o.id} className="cardx">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}><b>{o.number}</b><span className="tag">{STATUS_LABEL[o.status]}</span>{o.status === "awaiting_payment" && o.paidClaimed && <span className="tag g">Customer says paid</span>}<span className="small muted">{new Date(o.createdAt).toLocaleString()}</span></div>
          <div style={{ margin: "8px 0" }}>{o.name} | <a href={`https://wa.me/${waPhone(o.phone)}`} target="_blank" rel="noopener noreferrer">{o.phone} (WhatsApp)</a><div className="small">{o.address}</div><div className="small muted">Location: {o.zone}</div>{o.notes && <div className="small muted">Notes: {o.notes}</div>}</div>
          <ul style={{ margin: "8px 0", paddingLeft: 18 }}>{o.items.map((i) => <li key={i.pid + i.vid}>{i.qty} x {i.name}{i.variant ? ` (${i.variant})` : ""} {ngn(i.qty * i.price)}</li>)}</ul>
          <div>Items: {ngn(o.subtotal)} | Delivery: {o.deliveryFee === null ? "not set" : ngn(o.deliveryFee)}</div><b>Total: {ngn(orderTotal(o))}</b>
          {o.zone === "Other location" && o.status !== "delivered" && o.status !== "cancelled" && (
            <div style={{ marginTop: 10 }}><label className="lab" htmlFor={"f" + o.id}>Delivery fee confirmed on WhatsApp (naira)</label>
              <div className="row2"><input id={"f" + o.id} className="in-t" inputMode="numeric" value={fees[o.id] ?? (o.deliveryFee ?? "")} onChange={(e) => setFees({ ...fees, [o.id]: e.target.value.replace(/\D/g, "") })} /><button className="btn o" onClick={() => { const v = fees[o.id]; if (v === undefined || v === "") { setMsg("Enter the delivery fee first."); return; } patch(o.id, { deliveryFee: Number(v) }, "Delivery fee saved. The customer can see it on their order page."); }}>Save fee</button></div></div>
          )}
          <div className="acts">
            {NEXT[o.status] && <button className="btn sm fit" onClick={() => { if (o.status !== "awaiting_payment" || confirm("Only mark as paid if you can see the money in your bank app. Continue?")) patch(o.id, { status: NEXT[o.status]![0] }, "Order updated."); }}>{NEXT[o.status]![1]}</button>}
            {o.status !== "delivered" && o.status !== "cancelled" && <button className="btn red sm fit" onClick={() => { if (confirm("Cancel this order?")) patch(o.id, { status: "cancelled" }, "Order cancelled."); }}>Cancel order</button>}
          </div>
        </article>
      ))}
    </>
  );
}
