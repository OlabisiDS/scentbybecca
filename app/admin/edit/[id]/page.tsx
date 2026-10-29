/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { CATEGORIES } from "@/lib/config";
import { readImage } from "@/lib/image";
import { CONCENTRATIONS, GRADES, Product, Variant } from "@/lib/types";

type Img = { key: string; url: string; preview: string; status: "uploading" | "done" | "error"; error?: string; file?: File };
const blank = { name: "", brand: "", category: CATEGORIES[0].slug, sub: "", audience: "", concentration: "", description: "", notes: "", price: "", label: "", longevity: "", projection: "", sillage: "", longevityGrade: "", projectionGrade: "", sillageGrade: "" };
let seq = 0;
function Form() {
  const { id } = useParams<{ id: string }>(), from = useSearchParams().get("from"), router = useRouter();
  const { api, refresh } = useAdmin();
  const isNew = id === "new";
  const [f, setF] = useState(blank), [imgs, setImgs] = useState<Img[]>([]), [feat, setFeat] = useState(false), [combo, setCombo] = useState(true), [avail, setAvail] = useState(true), [mode, setMode] = useState<"number" | "grade">("number");
  const [multi, setMulti] = useState(false), [vars, setVars] = useState<Variant[]>([]);
  const [err, setErr] = useState<Record<string, string>>({}), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [state, setState] = useState<"load" | "ok" | "none">("load");
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return; loaded.current = true;
    if (isNew && !from) { setState("ok"); return; }
    api("products").then((j) => {
      const p: Product | undefined = j.items.find((x: Product) => x.id === (isNew ? from : id));
      if (!p) { setState("none"); return; }
      setF({ name: isNew ? p.name + " (copy)" : p.name, brand: p.brand, category: p.category, sub: p.sub, audience: p.audience, concentration: p.concentration, description: p.description, notes: p.notes, price: String(p.variants[0]?.price ?? ""), label: p.variants[0]?.label ?? "", longevity: p.longevity ? String(p.longevity) : "", projection: p.projection ? String(p.projection) : "", sillage: p.sillage ? String(p.sillage) : "", longevityGrade: p.longevityGrade, projectionGrade: p.projectionGrade, sillageGrade: p.sillageGrade });
      setMode(p.ratingMode); setImgs(p.images.map((u) => ({ key: "e" + seq++, url: u, preview: u, status: "done" as const }))); setFeat(p.featured); setCombo(p.combo); setAvail(p.variants[0]?.available ?? true);
      if (p.variants.length > 1) { setMulti(true); setVars(p.variants); }
      setState("ok");
    }).catch(() => setState("none"));
  }, [api, id, from, isNew]);
  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [dirty]);
  if (state === "load") return <p className="muted">Loading...</p>;
  if (state === "none") return <p>That product was not found. <Link href="/admin/products">Back to products</Link></p>;
  const set = (k: keyof typeof blank, v: string) => { setF((o) => ({ ...o, [k]: v })); setDirty(true); };
  const cat = CATEGORIES.find((c) => c.slug === f.category);
  const patchImg = (key: string, p: Partial<Img>) => setImgs((l) => l.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const upload = async (it: Img) => {
    try { const url = (await api("upload", { method: "POST", body: { dataUrl: await readImage(it.file!, 1200), folder: "products" } })).url; patchImg(it.key, { url, status: "done", error: undefined, file: undefined }); }
    catch (x) { patchImg(it.key, { status: "error", error: (x as Error).message }); }
  };
  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = 5 - imgs.length, chosen = Array.from(files).slice(0, Math.max(0, room));
    setErr((e) => ({ ...e, image: files.length > room ? `Only ${Math.max(0, room)} more photo${room === 1 ? "" : "s"} can be added (5 at most).` : "" }));
    const items: Img[] = chosen.map((file) => ({ key: "n" + seq++, url: "", preview: URL.createObjectURL(file), status: "uploading", file }));
    setImgs((l) => [...l, ...items]); setDirty(true);
    for (let i = 0; i < items.length; i += 3) await Promise.all(items.slice(i, i + 3).map(upload)); // 3 at a time; one failure never stops the others
  };
  const uploading = imgs.filter((i) => i.status === "uploading").length, failed = imgs.filter((i) => i.status === "error").length;
  const save = async (status: "draft" | "active") => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Enter the perfume name (at least 2 letters).";
    let variants: Variant[];
    if (multi) { variants = vars.map((v, i) => ({ ...v, id: v.id || "v" + (i + 1), label: v.label.trim() })); if (!variants.length || variants.some((v) => !v.label || !isFinite(v.price) || v.price < 0)) e.price = "Give every size a name and a price (0 or more)."; }
    else { const p = Number(f.price); if (f.price.trim() === "" || !isFinite(p) || p < 0) e.price = "Enter a price in naira, for example 25000."; variants = [{ id: "v1", label: f.label.trim(), price: p, available: avail }]; }
    if (f.description.length > 2000) e.description = "The description is too long. Keep it under 2000 characters.";
    if (f.notes.length > 1000) e.notes = "The notes are too long. Keep them under 1000 characters.";
    if (uploading) e.image = "Please wait for the photos to finish uploading.";
    else if (failed) e.image = "Some photos did not upload. Retry or remove them first.";
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api("products", { method: "POST", body: { id: isNew ? undefined : id, ...f, ratingMode: mode, variants, images: imgs.map((i) => i.url), featured: feat, combo, status } });
      setDirty(false); refresh(); router.push("/admin/products");
    } catch (x) { setErr({ form: (x as Error).message }); setBusy(false); }
  };
  const Fe = ({ k }: { k: string }) => (err[k] ? <div className="err" role="alert">{err[k]}</div> : null);
  const R = ({ k, label }: { k: "longevity" | "projection" | "sillage"; label: string }) => {
    const gk = (k + "Grade") as "longevityGrade" | "projectionGrade" | "sillageGrade";
    return <div><label className="lab" htmlFor={k}>{label}</label>{mode === "number"
      ? <select id={k} value={f[k]} onChange={(e) => set(k, e.target.value)}><option value="">Not rated</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} out of 10</option>)}</select>
      : <select id={k} value={f[gk]} onChange={(e) => set(gk, e.target.value)}><option value="">Not rated</option>{GRADES.map((g) => <option key={g}>{g}</option>)}</select>}</div>;
  };
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
        <button className="btn o sm fit" onClick={() => { setVars([...vars, { id: "v" + (vars.length + 1) + (Date.now() % 1000), label: "", price: 0, available: true }]); setDirty(true); }}><Plus size={16} />Add another size</button><Fe k="price" />
      </>)}
      <label className="lab" htmlFor="ds">Description</label><textarea id="ds" value={f.description} onChange={(e) => set("description", e.target.value)} /><div className="hint">Press Enter to start a new line. Line breaks are kept on the store.</div><Fe k="description" />
      <label className="lab" htmlFor="fn">Fragrance notes (optional)</label>
      <textarea id="fn" rows={6} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder={"Top notes: Apple, bergamot and citrus\nMiddle notes: Lavender and spices\nBase notes: Vanilla, amber and woody accords"} />
      <div className="hint">Press Enter to start a new line. Only enter notes you have verified.</div><Fe k="notes" />
      <span className="lab">Your ratings (optional)</span>
      <div className="chips" role="radiogroup" aria-label="Rating style"><button type="button" role="radio" aria-checked={mode === "number"} className={"chip" + (mode === "number" ? " on" : "")} onClick={() => { setMode("number"); setDirty(true); }}>Numbers (1 to 10)</button><button type="button" role="radio" aria-checked={mode === "grade"} className={"chip" + (mode === "grade" ? " on" : "")} onClick={() => { setMode("grade"); setDirty(true); }}>Grades (Fair to Excellent)</button></div>
      <div className="hint" style={{ marginBottom: 6 }}>Each perfume can use its own style. Anything left as Not rated shows a dash on the store.</div>
      <div className="row2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}><R k="longevity" label="Longevity" /><R k="projection" label="Projection" /><R k="sillage" label="Sillage" /></div>
      <span className="lab">Photos (optional, up to 5)</span>
      <div className="rimgs">{imgs.map((it, i) => (
        <div key={it.key} style={{ width: 110 }}>
          <div className="ph"><img src={it.preview} alt={`Photo ${i + 1}`} style={{ opacity: it.status === "uploading" ? 0.5 : 1 }} /></div>
          {it.status === "uploading" && <div className="hint">Uploading...</div>}
          {it.status === "error" && <><div className="err">{it.error}</div><button className="btn o sm" onClick={() => { patchImg(it.key, { status: "uploading" }); upload(it); }}>Retry</button></>}
          {it.status === "done" && (i === 0 ? <span className="tag g">Cover</span> : <button className="btn o sm" onClick={() => { setImgs([it, ...imgs.filter((x) => x.key !== it.key)]); setDirty(true); }}>Make cover</button>)}
          <button className="btn red sm" onClick={() => { setImgs(imgs.filter((x) => x.key !== it.key)); setDirty(true); }}>Remove</button>
        </div>))}</div>
      {imgs.length < 5 && <label className="btn o sm fit" style={{ marginTop: 8, cursor: "pointer" }}>Choose photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Choose product photos" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} style={{ position: "absolute", left: -9999 }} /></label>}
      <div className="hint">Select several photos at once. JPG, PNG or WebP, up to 8 MB each. The first photo is the cover.{uploading > 0 && ` Uploading ${uploading} photo${uploading === 1 ? "" : "s"}...`}</div><Fe k="image" />
      <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "16px 0 0", minHeight: 44 }}><input type="checkbox" checked={feat} onChange={(e) => { setFeat(e.target.checked); setDirty(true); }} style={{ width: 22, height: 22 }} />Show in &quot;Worth Discovering&quot; on the home page</label>
      <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}><input type="checkbox" checked={combo} onChange={(e) => { setCombo(e.target.checked); setDirty(true); }} style={{ width: 22, height: 22 }} />Include in the combo builder</label>
      {err.form && <p className="err" role="alert">{err.form}</p>}
      <div className="row2" style={{ marginTop: 20 }}><button className="btn o" disabled={busy || uploading > 0} onClick={() => save("draft")}>Save draft</button><button className="btn" disabled={busy || uploading > 0} onClick={() => save("active")}>{busy ? "Saving..." : "Publish"}</button></div>
    </>
  );
}
export default function EditPage() { return <Suspense fallback={<p className="muted">Loading...</p>}><Form /></Suspense>; }
