/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import type { Bank } from "@/lib/types";

export default function Banks() {
  const { api } = useAdmin();
  const [banks, setBanks] = useState<Bank[] | null>(null), [msg, setMsg] = useState(""), [err, setErr] = useState("");
  const load = () => api("banks").then((j) => setBanks(j.items));
  useEffect(() => { load(); }, [api]); // eslint-disable-line
  if (!banks) return <p className="muted">Loading...</p>;
  const up = (i: number, p: Partial<Bank>) => setBanks(banks.map((b, k) => (k === i ? { ...b, ...p } : b)));
  const save = async () => {
    setErr("");
    if (!confirm("Save these bank details? Customers will be asked to pay to these accounts. Check every number carefully.")) return;
    try { await api("banks", { method: "PUT", body: { items: banks } }); setMsg("Bank accounts saved."); setTimeout(() => setMsg(""), 3000); load(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <>
      <h1>Bank accounts</h1>
      <p className="warn">These are the accounts customers pay into. Check them carefully, and never share your admin sign in with anyone.</p>
      {msg && <div className="fb" role="status">{msg}</div>}
      {banks.map((b, i) => (
        <div className="cardx" key={b.id || "n" + i}>
          <label className="lab" htmlFor={"b" + i}>Bank name</label><input id={"b" + i} className="in-t" value={b.bank} onChange={(e) => up(i, { bank: e.target.value })} />
          <label className="lab" htmlFor={"n" + i}>Account name</label><input id={"n" + i} className="in-t" value={b.name} onChange={(e) => up(i, { name: e.target.value })} />
          <label className="lab" htmlFor={"u" + i}>Account number</label><input id={"u" + i} className="in-t" inputMode="numeric" value={b.number} onChange={(e) => up(i, { number: e.target.value.replace(/\D/g, "") })} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={b.active} onChange={(e) => up(i, { active: e.target.checked })} style={{ width: 22, height: 22 }} />Show to customers</label><button className="btn red sm fit" onClick={() => setBanks(banks.filter((_, k) => k !== i))}><Trash2 size={16} />Remove</button></div>
        </div>
      ))}
      {err && <p className="err" role="alert">{err}</p>}
      <div className="acts"><button className="btn o sm fit" onClick={() => setBanks([...banks, { id: "", bank: "", name: "", number: "", active: true }])}><Plus size={16} />Add another bank account</button><button className="btn sm fit" onClick={save}>Save bank accounts</button></div>
    </>
  );
}
