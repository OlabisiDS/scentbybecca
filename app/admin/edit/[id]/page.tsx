/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { CATEGORIES } from "@/lib/config";
import { readImage } from "@/lib/image";
import { CONCENTRATIONS, Product, Variant } from "@/lib/types";

const blank = { name: "", brand: "", category: CATEGORIES[0].slug, sub: "", audience: "", concentration: "", description: "", notes: "", longevity: "", projection: "", sillage: "", price: "", label: "" };
function Form() {
  const { id } = useParams<{ id: string }>(), from = useSearchParams().get("from"), router = useRouter();
  const { api, refresh } = useAdmin();
  const isNew = id === "new";
  const [f, setF] = useState(blank), [imgs, setImgs] = useState<string[]>([]), [feat, setFeat] = useState(false), [combo, setCombo] = useState(true), [avail, setAvail] = useState(true);
  const [multi, setMulti] = useState(false), [vars, setVars] = useState<Variant[]>([]);
  const [err, setErr] = useState<Record<string, string>>({}), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [state, setState] = useState<"load" | "ok" | "none">("load");
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return; loaded.current = true;
    if (isNew && !from) { setState("ok"); return; }
    api("products").then((j) => {
      const p: Product | undefined = j.items.find((x: Product) => x.id === (isNew ? from : id));
      if (!p) { setState("none"); return; }
      setF({ name: isNew ? p.name + " (copy)" : p.name, brand: p.brand, category: p.category, sub: p.sub, audience: p.audience, concentration: p.concentration, description: p.description, notes: p.notes, longevity: p.longevity ? String(p.longevity) : "", projection: p.projection ? String(p.projection) : "", sillage: p.sillage ? String(p.sillage) : "", price: String(p.variants[0]?.price ?? ""), label: p.variants[0]?.label ?? "" });
      setImgs(p.images); setFeat(p.featured); setCombo(p.combo); setAvail(p.variants[0]?.available ?? true);
      if (p.variants.length > 1) { setMulti(true); setVars(p.variants); }
      setState("ok");
    }).catch(() => setState("none"));
  }, [api, id, from, isNew]);
  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [dirty]);
  if (state === "load") return <p className="muted">Loading...</p>;
  if (state === "none") return <p>That product was not found. <Link href="/admin/products">Back to products</Link></p>;
  const set = (k: keyof typeof blank, v: string) => { setF((o) => ({ ...o, [k]: v })); setDirty(true); };
  const cat = CATEGORIES.find((c) => c.slug === f.category);
  const addImgs = async (files: FileList | null) => {
    if (!files) return; const list = [...imgs]; let msg = "";
    for (const file of Array.from(files)) { if (list.length >= 5) { msg = "You can add up to 5 photos."; break; } try { list.push(await readImage(file, 900)); } catch (x) { msg = (x as Error).message; } }
    setImgs(list); setDirty(true); setErr((e) => ({ ...e, image: msg }));
  };
  const save = async (status: "draft" | "active") => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Enter the perfume name (at least 2 letters).";
    let variants: Variant[];
    if (multi) { variants = vars.map((v, i) => ({ ...v, id: v.id || "v" + (i + 1), label: v.label.trim() })); if (!variants.length || variants.some((v) => !v.label || !isFinite(v.price) || v.price < 0)) e.price = "Give every size a name and a price (0 or more)."; }
    else { const p = Number(f.price); if (f.price.trim() === "" || !isFinite(p) || p < 0) e.price = "Enter a price in naira, for example 25000."; variants = [{ id: "v1", label: f.label.trim(), price: p, available: avail }]; }
    if (f.description.length > 2000) e.description = "The description is too long. Keep it under 2000 characters.";
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const s of imgs) urls.push(s.startsWith("data:") ? (await api("upload", { method: "POST", body: { dataUrl: s, folder: "products" } })).url : s);
      await api("products", { method: "POST", body: { id: isNew ? undefined : id, ...f, variants, images: urls, featured: feat, combo, status } });
      setDirty(false); refresh(); router.push("/admin/products");
    } catch (x) { setErr({ form: (x as Error).message }); setBusy(false); }
  };
  const Fe = ({ k }: { k: string }) => (err[k] ? <div className="err" role="alert">{err[k]}</div> : null);
  const Rt = ({ k, label }: { k: "longevity" | "projection" | "sillage"; label: string }) => <div><label className="lab" htmlFor={k}>{label}</label><select id={k} value={f[k]} onChange={(e) => set(k, e.target.value)}><option value="">Not rated</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} out of 10</option>)}</select></div>;
  const upV = (i: number, p: Partial<Variant>) => { setVars(vars.map((v, k) => (k === i ? { ...v, ...p } : v))); setDirty(true); };
  return (
    <>
      <p><Link href="/admin/products" onClick={(e) => { if (dirty && !confirm("You have unsaved changes. Leave without saving?")) e.preventDefault(); }}>Back to products</Link></p>
      <h1>{isNew ? "Add New Perfume" : "Edit perfume"}</h1>
      <p className="muted small">Fields marked * are required.</p>
      <label className="lab" htmlFor="nm">Perfume name *</label><input id="nm" className="in-t" value={f.name} onChange={(e) => set("name", e.target.value)} /><Fe k="name" />
      <label className="lab" htmlFor="br">Brand</label><input id="br" className="in-t" value={f.brand} onChange={(e) => set("brand", e.target.value)} />
      <label className="lab" htmlFor="ct">Category *</label><select id="ct" value={f.category} onChange={(e) => { set("category", e.target.value); set("sub", ""); }}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
      {cat?.subs && <><label className="lab" htmlFor="sb">Sub-section</label><select id="sb" value={f.sub} onChange={(e) => set("sub", e.target.value)}><option value="">None</option>{cat.subs.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></>}
      <label className="lab" htmlFor="au">For</label><select id="au" value={f.audience} onChange={(e) => set("audience", e.target.value)}><option value="">Not specified</option><option>Women</option><option>Men</option><option>Unisex</option></select>
      <label className="lab" htmlFor="cn">Concentration (optional)</label><select id="cn" value={f.concentration} onChange={(e) => set("concentration", e.target.value)}><option value="">Not specified</option>{CONCENTRATIONS.map((c) => <option key={c}>{c}</option>)}</select>
      <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0 4px", minHeight: 44 }}><input type="checkbox" checked={multi} onChange={(e) => { setMulti(e.target.checked); setDirty(true); if (e.target.checked && !vars.length) setVars([{ id: "v1", label: f.label, price: Number(f.price) || 0, available: avail }]); }} style={{ width: 22, height: 22 }} />This perfume comes in several sizes</label>
      {!multi ? (<>
        <div className="row2"><div><label className="lab" htmlFor="pr">Price in naira *</label><input id="pr" className="in-t" inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9.]/g, ""))} /></div>
          <div><label className="lab" htmlFor="sz">Size (optional)</label><input id="sz" className="in-t" placeholder="Example: 100ml" value={f.label} onChange={(e) => set("label", e.target.value)} /></div></div><Fe k="price" />
        <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={avail} onChange={(e) => { setAvail(e.target.checked); setDirty(true); }} style={{ width: 22, height: 22 }} />Available (untick to show as out of stock)</label>
      </>) : (<>
        <span className="lab">Sizes</span>
        {vars.map((v, i) => (
          <div className="cardx" key={i}>
            <div className="row2"><div><label className="lab" htmlFor={"vl" + i}>Size name</label><input id={"vl" + i} className="in-t" placeholder="Example: 50ml" value={v.label} onChange={(e) => upV(i, { label: e.target.value })} /></div>
              <div><label className="lab" htmlFor={"vp" + i}>Price in naira</label><input id={"vp" + i} className="in-t" inputMode="numeric" value={String(v.price || "")} onChange={(e) => upV(i, { price: Number(e.target.value.replace(/\D/g, "")) })} /></div></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={v.available} onChange={(e) => upV(i, { available: e.target.checked })} style={{ width: 22, height: 22 }} />Available</label>
              {vars.length > 1 && <button className="btn red sm fit" onClick={() => { setVars(vars.filter((_, k) => k !== i)); setDirty(true); }}><Trash2 size={16} />Remove</button>}</div>
          </div>))}
        <button className="btn o sm fit" onClick={() => { setVars([...vars, { id: "v" + (vars.length + 1) + Date.now() % 1000, label: "", price: 0, available: true }]); setDirty(true); }}><Plus size={16} />Add another size</button><Fe k="price" />
      </>)}
      <label className="lab" htmlFor="ds">Description</label><textarea id="ds" value={f.description} onChange={(e) => set("description", e.target.value)} /><Fe k="description" />
      <label className="lab" htmlFor="fn">Fragrance notes (optional)</label><input id="fn" className="in-t" value={f.notes} onChange={(e) => set("notes", e.target.value)} /><div className="hint">Only enter notes you have verified.</div>
      <span className="lab">Your ratings (optional)</span><div className="hint" style={{ marginBottom: 6 }}>Anything left as Not rated shows a dash on the store.</div>
      <div className="row2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}><Rt k="longevity" label="Longevity" /><Rt k="projection" label="Projection" /><Rt k="sillage" label="Sillage" /></div>
      <span className="lab">Photos (optional, up to 5)</span>
      <div className="rimgs">{imgs.map((s, i) => <div key={i} style={{ width: 110 }}><div className="ph"><img src={s} alt={`Photo ${i + 1}`} /></div>{i === 0 ? <span className="tag g">Cover</span> : <button className="btn o sm" onClick={() => { setImgs([s, ...imgs.filter((_, k) => k !== i)]); setDirty(true); }}>Make cover</button>}<button className="btn red sm" onClick={() => { setImgs(imgs.filter((_, k) => k !== i)); setDirty(true); }}>Remove</button></div>)}</div>
      {imgs.length < 5 && <input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Choose product photos" onChange={(e) => { addImgs(e.target.files); e.target.value = ""; }} />}
      <div className="hint">JPG, PNG or WebP, up to 8 MB each. The first photo is the cover.</div><Fe k="image" />
      <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0 0", minHeight: 44 }}><input type="checkbox" checked={feat} onChange={(e) => { setFeat(e.target.checked); setDirty(true); }} style={{ width: 22, height: 22 }} />Show in &quot;Worth Discovering&quot; on the home page</label>
      <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={combo} onChange={(e) => { setCombo(e.target.checked); setDirty(true); }} style={{ width: 22, height: 22 }} />Include in the combo builder</label>
      {err.form && <p className="err" role="alert">{err.form}</p>}
      <div className="row2" style={{ marginTop: 20 }}><button className="btn o" disabled={busy} onClick={() => save("draft")}>Save draft</button><button className="btn" disabled={busy} onClick={() => save("active")}>{busy ? "Saving..." : "Publish"}</button></div>
    </>
  );
}
export default function EditPage() { return <Suspense fallback={<p className="muted">Loading...</p>}><Form /></Suspense>; }
