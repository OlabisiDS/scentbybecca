/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/AdminShell";
import { readImage } from "@/lib/image";
import { PAGE_KEYS } from "@/lib/types";

export default function Headers() {
  const { api } = useAdmin();
  const [imgs, setImgs] = useState<Record<string, string> | null>(null), [busy, setBusy] = useState(""), [err, setErr] = useState("");
  const load = useCallback(() => api("page-headers").then((j) => setImgs(Object.fromEntries(j.items.map((x: any) => [x.page, x.image_url])))).catch((e) => setErr(e.message)), [api]);
  useEffect(() => { load(); }, [load]);
  const put = async (page: string, imageUrl: string) => { await api("page-headers", { method: "PUT", body: { page, imageUrl } }); load(); };
  const pick = async (page: string, file?: File) => {
    if (!file) return; setBusy(page); setErr("");
    try { const url = (await api("upload", { method: "POST", body: { dataUrl: await readImage(file, 1600), folder: "headers" } })).url; await put(page, url); } catch (e) { setErr((e as Error).message); }
    setBusy("");
  };
  if (!imgs) return <p className="muted">{err || "Loading..."}</p>;
  return (
    <>
      <h1>Page headers</h1>
      <p className="muted small">The wide picture at the top of each page, with the page name written over it. Use a wide photo, for example 1600 by 700. Without a picture, a soft gold background shows. Category pages use that category&apos;s first cover photo.</p>
      {err && <p className="err" role="alert">{err}</p>}
      {PAGE_KEYS.map(([k, label]) => (
        <div className="cardx" key={k}>
          <b>{label}</b>
          {imgs[k] ? <div style={{ maxWidth: 320, margin: "8px 0" }}><div className="ph" style={{ aspectRatio: "16/6" }}><img src={imgs[k]} alt={`${label} header`} /></div><button className="btn red sm fit" onClick={() => put(k, "")}>Remove picture</button></div> : <p className="small muted">No picture yet.</p>}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Choose header picture for ${label}`} disabled={busy === k} onChange={(e) => { pick(k, e.target.files?.[0]); e.target.value = ""; }} />
          {busy === k && <div className="hint">Uploading...</div>}
        </div>
      ))}
    </>
  );
}
