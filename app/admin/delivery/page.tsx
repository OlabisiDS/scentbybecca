/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import type { Zone } from "@/lib/types";

export default function Delivery() {
  const { api } = useAdmin();
  const [zones, setZones] = useState<Zone[] | null>(null), [paused, setPaused] = useState(false), [pm, setPm] = useState(""), [msg, setMsg] = useState("");
  const load = () => { api("zones").then((j) => setZones(j.items)); api("settings").then((j) => { setPaused(!!j.value.paused); setPm(j.value.message || ""); }); };
  useEffect(load, [api]); // eslint-disable-line
  if (!zones) return <p className="muted">Loading...</p>;
  const up = (i: number, p: Partial<Zone>) => setZones(zones.map((z, k) => (k === i ? { ...z, ...p } : z)));
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  return (
    <>
      <h1>Delivery and orders</h1>
      {msg && <div className="fb" role="status">{msg}</div>}
      <h2 style={{ fontSize: 18, margin: "8px 0" }}>Delivery locations</h2>
      <p className="muted small">Switch a location on and set its fee. Customers pay that fee with their order. Locations that are off, and all other places, are confirmed with the customer on WhatsApp after they order.</p>
      {zones.map((z, i) => (
        <div className="cardx" key={z.id || "n" + i}>
          <div className="row2"><div><label className="lab" htmlFor={"zn" + i}>Location</label><input id={"zn" + i} className="in-t" value={z.name} onChange={(e) => up(i, { name: e.target.value })} /></div>
            <div><label className="lab" htmlFor={"zf" + i}>Delivery fee (naira)</label><input id={"zf" + i} className="in-t" inputMode="numeric" value={String(z.fee || "")} onChange={(e) => up(i, { fee: Number(e.target.value.replace(/\D/g, "")) })} /></div></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={z.enabled} onChange={(e) => up(i, { enabled: e.target.checked })} style={{ width: 22, height: 22 }} />Switched on</label><button className="btn red sm fit" onClick={() => setZones(zones.filter((_, k) => k !== i))}><Trash2 size={16} />Remove</button></div>
        </div>
      ))}
      <div className="acts"><button className="btn o sm fit" onClick={() => setZones([...zones, { id: "", name: "", fee: 0, enabled: false, sort: zones.length }])}><Plus size={16} />Add a location</button>
        <button className="btn sm fit" onClick={async () => { if (!confirm("Save these delivery locations and fees? Customers will see them at checkout.")) return; try { await api("zones", { method: "PUT", body: { items: zones } }); flash("Delivery locations saved."); load(); } catch (e) { flash((e as Error).message); } }}>Save locations</button></div>
      <h2 style={{ fontSize: 18, margin: "28px 0 8px" }}>Pause orders</h2>
      <p className="muted small">Use this when you are away. Customers can still browse, but cannot place orders.</p>
      <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} style={{ width: 22, height: 22 }} />Pause new orders</label>
      <label className="lab" htmlFor="pm">Message to customers</label><input id="pm" className="in-t" value={pm} maxLength={200} onChange={(e) => setPm(e.target.value)} placeholder="Example: We are away and will be back on Monday." />
      <p><button className="btn sm fit" onClick={async () => { try { await api("settings", { method: "PUT", body: { paused, message: pm } }); flash("Saved."); } catch (e) { flash((e as Error).message); } }}>Save</button></p>
    </>
  );
}
