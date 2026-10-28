"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Track() {
  const router = useRouter();
  const [num, setNum] = useState(""), [ph, setPh] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const find = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: num, phone: ph }) });
    const j = await r.json().catch(() => ({})); setBusy(false);
    if (r.ok) router.push(`/orders/${j.id}`); else setErr(j.error || "Could not find that order.");
  };
  return (
    <div className="wrap pad" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 26, marginBottom: 12 }}>Track your order</h1>
      <label className="lab" htmlFor="on">Order number</label><input id="on" className="in-t" placeholder="SBB-123456" value={num} onChange={(e) => setNum(e.target.value)} />
      <label className="lab" htmlFor="op">Phone number used for the order</label><input id="op" className="in-t" inputMode="tel" value={ph} onChange={(e) => setPh(e.target.value)} />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} onClick={find} disabled={busy}>{busy ? "Searching..." : "Find my order"}</button>
    </div>
  );
}
