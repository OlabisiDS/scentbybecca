"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRecent } from "@/lib/hooks";
import { STATUS_LABEL, type OrderStatus } from "@/lib/types";

export default function Track() {
  const router = useRouter();
  const [recent] = useRecent();
  const [num, setNum] = useState(""), [ph, setPh] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [st, setSt] = useState<Record<string, string>>({});
  useEffect(() => { recent.slice(0, 5).forEach(async (r) => { const x = await fetch(`/api/orders/${r.id}`); if (x.ok) { const j = await x.json(); setSt((s) => ({ ...s, [r.id]: STATUS_LABEL[j.order.status as OrderStatus] })); } }); }, [recent]);
  const find = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: num, phone: ph }) });
    const j = await r.json().catch(() => ({})); setBusy(false);
    if (r.ok) router.push(`/orders/${j.id}`); else setErr(j.error || "Could not find that order.");
  };
  return (
    <div className="wrap pad" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Track your order</h1>
      <label className="lab" htmlFor="on">Order reference</label><input id="on" className="in-t" placeholder="SBB-123456" value={num} onChange={(e) => setNum(e.target.value)} />
      <label className="lab" htmlFor="op">Phone number used for the order</label><input id="op" className="in-t" inputMode="tel" value={ph} onChange={(e) => setPh(e.target.value)} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} onClick={find} disabled={busy}>{busy ? "Searching..." : "Find my order"}</button>
      {recent.length > 0 && <><h2 style={{ fontSize: 16, margin: "28px 0 8px" }}>Orders from this device</h2>{recent.slice(0, 5).map((r) => <Link key={r.id} href={`/orders/${r.id}`} className="cardx" style={{ display: "flex", justifyContent: "space-between", textDecoration: "none", marginBottom: 8, background: "#fff", border: "1px solid var(--border)", padding: 12 }}><b>{r.number}</b><span className="small muted">{st[r.id] || "..."}</span></Link>)}</>}
    </div>
  );
}
