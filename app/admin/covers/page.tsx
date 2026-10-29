/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Image as ImgIcon } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { CATEGORIES } from "@/lib/config";
import { readImage } from "@/lib/image";

export default function Covers() {
  const { api } = useAdmin();
  const [covers, setCovers] = useState<Record<string, string[]> | null>(null), [err, setErr] = useState<Record<string, string>>({}), [busy, setBusy] = useState("");
  useEffect(() => { api("covers").then((j) => setCovers(Object.fromEntries(j.items.map((x: any) => [x.category, x.images])))); }, [api]);
  if (!covers) return <p className="muted">Loading...</p>;
  const put = async (slug: string, images: string[]) => { await api("covers", { method: "PUT", body: { category: slug, images } }); setCovers((c) => ({ ...c!, [slug]: images })); };
  const pick = async (slug: string, files: FileList | null) => {
    if (!files) return; const list = [...(covers[slug] || [])]; let msg = ""; setBusy(slug);
    try { for (const f of Array.from(files)) { if (list.length >= 3) { msg = "You can add up to 3 covers per category."; break; } list.push((await api("upload", { method: "POST", body: { dataUrl: await readImage(f, 1400), folder: "covers" } })).url); } await put(slug, list); }
    catch (x) { msg = (x as Error).message; }
    setBusy(""); setErr((e) => ({ ...e, [slug]: msg }));
  };
  return (
    <>
      <h1>Category covers</h1>
      <p className="muted small">Add up to 3 wide (landscape) photos per category, for example 1600 by 800 pixels. With more than one, the home page box fades between them at random moments. With none, the box uses a product photo or a placeholder.</p>
      {CATEGORIES.map((c) => { const l = covers[c.slug] || []; return (
        <div className="cardx" key={c.slug}>
          <b>{c.name}</b>
          <div className="rimgs" style={{ margin: "8px 0" }}>{l.length === 0 && <div className="tile" style={{ width: 110 }}><div className="im"><ImgIcon size={26} strokeWidth={1.5} aria-hidden="true" /></div></div>}
            {l.map((s, i) => <div key={i} style={{ width: 110 }}><div className="tile"><div className="im"><img src={s} alt={`${c.name} cover ${i + 1}`} /></div></div><button className="btn red sm" onClick={() => put(c.slug, l.filter((_, k) => k !== i))}>Remove</button></div>)}</div>
          {l.length < 3 && <input type="file" multiple aria-label={`Add cover photos for ${c.name}`} accept="image/jpeg,image/png,image/webp" disabled={busy === c.slug} onChange={(e) => { pick(c.slug, e.target.files); e.target.value = ""; }} style={{ maxWidth: "100%" }} />}
          {busy === c.slug && <div className="hint">Uploading...</div>}
          {err[c.slug] && <div className="err" role="alert">{err[c.slug]}</div>}
        </div>); })}
    </>
  );
}
