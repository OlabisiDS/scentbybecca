/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";

type A = { id: string; name: string; fee: number | null; enabled: boolean };
type Z = { id: string; name: string; fee: number; enabled: boolean; areas: A[] };
export default function Delivery() {
  const { api } = useAdmin();
  const [zones, setZones] = useState<Z[] | null>(null), [paused, setPaused] = useState(false), [pm, setPm] = useState(""), [msg, setMsg] = useState(""), [err, setErr] = useState("");
  const load = () => { api("zones").then((j) => setZones(j.items)).catch((e) => setErr(e.message)); api("settings").then((j) => { setPaused(!!j.value.paused); setPm(j.value.message || ""); }); };
  useEffect(load, [api]); // eslint-disable-line
  if (!zones) return <p className="muted">{err || "Loading..."}</p>;
  const up = (i: number, p: Partial<Z>) => setZones(zones.map((z, k) => (k === i ? { ...z, ...p } : z)));
  const upA = (i: number, j: number, p: Partial<A>) => up(i, { areas: zones[i].areas.map((a, k) => (k === j ? { ...a, ...p } : a)) });
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  return (
    <>
      <h1>Delivery and orders</h1>
      {msg && <div className="fb" role="status">{msg}</div>}{err && <p className="err" role="alert">{err}</p>}
      <h2 style={{ fontSize: 16, margin: "8px 0" }}>Delivery locations</h2>
      <p className="muted small">Switch a location on and set its fee. If a location has areas, customers choose their area and pay that area&apos;s fee (an area with no fee of its own uses the location fee). Customers whose area is not listed, and all other places, get their fee confirmed on WhatsApp.</p>
      {zones.map((z, i) => (
        <div className="cardx" key={z.id || "n" + i}>
          <div className="row2"><div><label className="lab" htmlFor={"zn" + i}>Location</label><input id={"zn" + i} className="in-t" value={z.name} onChange={(e) => up(i, { name: e.target.value })} /></div>
            <div><label className="lab" htmlFor={"zf" + i}>Location fee (naira)</label><input id={"zf" + i} className="in-t" inputMode="numeric" value={String(z.fee || "")} onChange={(e) => up(i, { fee: Number(e.target.value.replace(/\D/g, "")) })} /></div></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={z.enabled} onChange={(e) => up(i, { enabled: e.target.checked })} style={{ width: 22, height: 22 }} />Switched on</label><button className="btn red sm fit" onClick={() => { if (confirm(`Remove ${z.name || "this location"} and its areas?`)) setZones(zones.filter((_, k) => k !== i)); }}><Trash2 size={16} />Remove</button></div>
          <span className="lab">Areas in this location (optional)</span>
          {z.areas.map((a, j) => (
            <div key={a.id || "a" + j} style={{ borderLeft: "2px solid var(--gold)", paddingLeft: 10, marginBottom: 8 }}>
              <div className="row2"><div><label className="sr" htmlFor={`an${i}-${j}`}>Area name</label><input id={`an${i}-${j}`} className="in-t" placeholder="Area name, e.g. Tanke" value={a.name} onChange={(e) => upA(i, j, { name: e.target.value })} /></div>
                <div><label className="sr" htmlFor={`af${i}-${j}`}>Area fee</label><input id={`af${i}-${j}`} className="in-t" inputMode="numeric" placeholder="Uses location fee" value={a.fee === null ? "" : String(a.fee)} onChange={(e) => upA(i, j, { fee: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) })} /></div></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={a.enabled} onChange={(e) => upA(i, j, { enabled: e.target.checked })} style={{ width: 20, height: 20 }} />Shown to customers</label><button className="btn red sm fit" onClick={() => up(i, { areas: z.areas.filter((_, k) => k !== j) })}><Trash2 size={16} />Remove</button></div>
            </div>))}
          <button className="btn o sm fit" onClick={() => up(i, { areas: [...z.areas, { id: "", name: "", fee: null, enabled: true }] })}><Plus size={16} />Add an area</button>
        </div>
      ))}
      <div className="acts"><button className="btn o sm fit" onClick={() => setZones([...zones, { id: "", name: "", fee: 0, enabled: false, areas: [] }])}><Plus size={16} />Add a location</button>
        <button className="btn sm fit" onClick={async () => { if (!confirm("Save these delivery locations, areas and fees? Customers will see them at checkout.")) return; setErr(""); try { await api("zones", { method: "PUT", body: { items: zones } }); flash("Delivery locations saved."); load(); } catch (e) { setErr((e as Error).message); } }}>Save locations</button></div>
      <h2 style={{ fontSize: 16, margin: "28px 0 8px" }}>Pause orders</h2>
      <p className="muted small">Use this when you are away. Customers can still browse, but cannot place orders.</p>
      <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} style={{ width: 22, height: 22 }} />Pause new orders</label>
      <label className="lab" htmlFor="pm">Message to customers</label><input id="pm" className="in-t" value={pm} maxLength={200} onChange={(e) => setPm(e.target.value)} placeholder="Example: We are away and will be back on Monday." />
      <p><button className="btn sm fit" onClick={async () => { try { await api("settings", { method: "PUT", body: { paused, message: pm } }); flash("Saved."); } catch (e) { setErr((e as Error).message); } }}>Save</button></p>
    </>
  );
}
