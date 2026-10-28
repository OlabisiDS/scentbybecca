/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useAdmin } from "@/components/AdminShell";

function parseCsv(t: string) {
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cur); cur = ""; } else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
export default function Tools() {
  const { api, refresh } = useAdmin();
  const [rows, setRows] = useState<any[]>([]), [res, setRes] = useState<{ ok: number; errors: string[] } | null>(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const onFile = async (f?: File) => {
    setRes(null); setErr(""); if (!f) return;
    const r = parseCsv(await f.text()); const head = (r[0] || []).map((h) => h.trim().toLowerCase());
    if (!head.includes("name") || !head.includes("price")) { setErr("The file needs at least the columns: name, price. Download the sample to see the layout."); setRows([]); return; }
    setRows(r.slice(1).map((c) => Object.fromEntries(head.map((h, i) => [h, (c[i] || "").trim()]))));
  };
  const run = async () => { setBusy(true); try { setRes(await api("products-bulk", { method: "POST", body: { rows } })); setRows([]); refresh(); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  const backup = async () => { try { const j = await api("export"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(j, null, 2)], { type: "application/json" })); a.download = `scentbybecca-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); } catch (e) { setErr((e as Error).message); } };
  const sample = "name,brand,category,price,size,description\nSample Perfume,Sample Brand,Designer & Niche Fragrances,25000,100ml,A short description\n";
  return (
    <>
      <h1>Import and backup</h1>
      <h2 style={{ fontSize: 18, margin: "8px 0" }}>Import products from a spreadsheet</h2>
      <p className="muted small">Save your spreadsheet as CSV. Columns: name, brand, category, price, size, description. Products are added as drafts, so nothing goes live until you publish it. Add photos afterwards by editing each product.</p>
      <p><a href={"data:text/csv;charset=utf-8," + encodeURIComponent(sample)} download="products-sample.csv">Download a sample file</a></p>
      <input type="file" accept=".csv,text/csv" aria-label="Choose a CSV file" onChange={(e) => onFile(e.target.files?.[0])} />
      {rows.length > 0 && <p><b>{rows.length}</b> products found. <button className="btn sm fit" onClick={run} disabled={busy}>{busy ? "Importing..." : "Import as drafts"}</button></p>}
      {res && <div className="fb" role="status">{res.ok} products imported as drafts.{res.errors.length > 0 && <ul>{res.errors.map((x) => <li key={x}>{x}</li>)}</ul>}</div>}
      {err && <p className="err" role="alert">{err}</p>}
      <h2 style={{ fontSize: 18, margin: "28px 0 8px" }}>Backup</h2>
      <p className="muted small">Download a copy of your products, orders, reviews, delivery locations and bank accounts. Keep it somewhere safe.</p>
      <button className="btn o sm fit" onClick={backup}>Download backup</button>
      <h2 style={{ fontSize: 18, margin: "28px 0 8px" }}>Use the admin like an app</h2>
      <p className="muted small">On your phone, open this admin page in your browser menu and choose Add to Home screen. It then opens like an app.</p>
    </>
  );
}
