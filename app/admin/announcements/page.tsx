/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";

type A = { id: string; text: string; href: string; active: boolean };
export default function Announcements() {
  const { api } = useAdmin();
  const [items, setItems] = useState<A[] | null>(null), [msg, setMsg] = useState(""), [err, setErr] = useState("");
  const load = () => api("announcements").then((j) => setItems(j.items)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [api]); // eslint-disable-line
  if (!items) return <p className="muted">{err || "Loading..."}</p>;
  const up = (i: number, p: Partial<A>) => setItems(items.map((a, k) => (k === i ? { ...a, ...p } : a)));
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const c = [...items]; [c[i], c[j]] = [c[j], c[i]]; setItems(c); };
  return (
    <>
      <h1>Announcements</h1>
      <p className="muted small">Short lines above the header that take turns every 5 seconds, for example about delivery or an offer. Only write what is true. Up to 8 lines.</p>
      {msg && <div className="fb" role="status">{msg}</div>}{err && <p className="err" role="alert">{err}</p>}
      {items.map((a, i) => (
        <div className="cardx" key={a.id || "n" + i}>
          <label className="lab" htmlFor={"at" + i}>Message</label><input id={"at" + i} className="in-t" maxLength={120} value={a.text} onChange={(e) => up(i, { text: e.target.value })} />
          <label className="lab" htmlFor={"ah" + i}>Goes to when tapped (optional)</label><input id={"ah" + i} className="in-t" value={a.href} onChange={(e) => up(i, { href: e.target.value })} placeholder="/shop" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={a.active} onChange={(e) => up(i, { active: e.target.checked })} style={{ width: 22, height: 22 }} />Showing</label>
            <div className="acts" style={{ margin: 0 }}><button className="btn o sm fit" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button className="btn o sm fit" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button><button className="btn red sm fit" onClick={() => setItems(items.filter((_, k) => k !== i))}><Trash2 size={16} />Remove</button></div>
          </div>
        </div>))}
      <div className="acts">
        {items.length < 8 && <button className="btn o sm fit" onClick={() => setItems([...items, { id: "", text: "", href: "", active: true }])}><Plus size={16} />Add a line</button>}
        <button className="btn sm fit" onClick={async () => { setErr(""); try { await api("announcements", { method: "PUT", body: { items } }); setMsg("Saved."); setTimeout(() => setMsg(""), 3000); load(); } catch (e) { setErr((e as Error).message); } }}>Save</button>
      </div>
    </>
  );
}
