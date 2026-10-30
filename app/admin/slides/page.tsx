/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { readImage } from "@/lib/image";
import { HeroSlide, HeroVideo, slideLive } from "@/lib/types";

const toLocal = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
type F = { id?: string; title: string; kind: "image" | "video"; imageUrl: string; imageWideUrl: string; videoUrl: string; posterUrl: string; href: string; active: boolean; startsAt: string; endsAt: string };
const blank: F = { title: "", kind: "image", imageUrl: "", imageWideUrl: "", videoUrl: "", posterUrl: "", href: "", active: true, startsAt: "", endsAt: "" };
const state = (s: HeroSlide) => (!s.active ? "Switched off" : slideLive(s) ? "Live now" : s.startsAt && Date.parse(s.startsAt) > Date.now() ? "Scheduled" : "Expired");
export default function Slides() {
  const { api } = useAdmin();
  const [items, setItems] = useState<HeroSlide[] | null>(null), [videos, setVideos] = useState<HeroVideo[]>([]), [f, setF] = useState<F | null>(null), [msg, setMsg] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const load = useCallback(() => { api("hero-slides").then((j) => setItems(j.items)).catch((e) => setErr(e.message)); api("hero-videos").then((j) => setVideos(j.items)).catch(() => {}); }, [api]);
  useEffect(() => { load(); }, [load]);
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  const payload = (x: F) => ({ ...x, startsAt: fromLocal(x.startsAt), endsAt: fromLocal(x.endsAt) });
  const save = async () => { setBusy(true); setErr(""); try { await api("hero-slides", { method: "POST", body: payload(f!) }); setF(null); flash("Slide saved."); load(); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  const up = async (file: File | undefined, key: "imageUrl" | "imageWideUrl") => { if (!file) return; try { const url = (await api("upload", { method: "POST", body: { dataUrl: await readImage(file, 1600), folder: "slides" } })).url; setF((o) => ({ ...o!, [key]: url })); setErr(""); } catch (x) { setErr((x as Error).message); } };
  const move = async (i: number, d: number) => { const ids = items!.map((s) => s.id), j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; try { await api("hero-slides-order", { method: "PUT", body: { ids } }); load(); } catch (e) { setErr((e as Error).message); } };
  if (f) {
    const set = (p: Partial<F>) => setF({ ...f, ...p });
    return (
      <>
        <h1>{f.id ? "Edit slide" : "New slide"}</h1>
        <p className="muted small">Slides change on their own every 8 seconds on the home page. Put the words you want customers to read inside the picture itself.</p>
        <label className="lab" htmlFor="st">Name (only you see this, and it is read aloud for screen readers)</label><input id="st" className="in-t" maxLength={80} value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Example: Christmas gift sets" />
        <div className="chips" role="radiogroup" aria-label="Slide type"><button type="button" role="radio" aria-checked={f.kind === "image"} className={"chip" + (f.kind === "image" ? " on" : "")} onClick={() => set({ kind: "image" })}>Picture</button><button type="button" role="radio" aria-checked={f.kind === "video"} className={"chip" + (f.kind === "video" ? " on" : "")} onClick={() => set({ kind: "video" })}>Video</button></div>
        {f.kind === "image" ? (<>
          <span className="lab">Phone picture * (tall, 4 by 5, for example 1080 by 1350)</span>
          {f.imageUrl && <div style={{ maxWidth: 160 }}><div className="ph"><img src={f.imageUrl} alt="Phone picture" /></div></div>}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose phone picture" onChange={(e) => { up(e.target.files?.[0], "imageUrl"); e.target.value = ""; }} />
          <span className="lab">Wide picture for computers (optional, for example 1920 by 960)</span>
          {f.imageWideUrl && <div style={{ maxWidth: 260 }}><div className="ph" style={{ aspectRatio: "2/1" }}><img src={f.imageWideUrl} alt="Wide picture" /></div><button className="btn red sm fit" onClick={() => set({ imageWideUrl: "" })}>Remove</button></div>}
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose wide picture" onChange={(e) => { up(e.target.files?.[0], "imageWideUrl"); e.target.value = ""; }} />
          <p className="hint">Without a wide picture, computers show the phone picture cropped.</p>
        </>) : (<>
          <label className="lab" htmlFor="vs">Video * (upload videos in Video library first)</label>
          <select id="vs" value={f.videoUrl} onChange={(e) => { const v = videos.find((x) => x.videoUrl === e.target.value); set({ videoUrl: e.target.value, posterUrl: v?.posterUrl || "" }); }}><option value="">Choose a video</option>{videos.map((v) => <option key={v.id} value={v.videoUrl}>{v.title}</option>)}</select>
        </>)}
        <label className="lab" htmlFor="hr">Where the slide goes when tapped (optional)</label><input id="hr" className="in-t" value={f.href} onChange={(e) => set({ href: e.target.value })} placeholder="/shop?cat=gift-sets" />
        <div className="row2"><div><label className="lab" htmlFor="s1">Shows from (optional)</label><input id="s1" className="in-t" type="datetime-local" value={f.startsAt} onChange={(e) => set({ startsAt: e.target.value })} /></div><div><label className="lab" htmlFor="s2">Shows until (optional)</label><input id="s2" className="in-t" type="datetime-local" value={f.endsAt} onChange={(e) => set({ endsAt: e.target.value })} /></div></div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0", minHeight: 44 }}><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} style={{ width: 22, height: 22 }} />Switched on</label>
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row2"><button className="btn o" onClick={() => { setF(null); setErr(""); }}>Cancel</button><button className="btn" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save slide"}</button></div>
      </>
    );
  }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}><h1 style={{ margin: 0 }}>Hero slides</h1><button className="btn fit" onClick={() => setF(blank)}><Plus size={18} />New slide</button></div>
      <p className="muted small">The big pictures at the top of the home page, in this order. If no slide is live, the home page shows the old video instead.</p>
      {msg && <div className="fb" role="status">{msg}</div>}{err && <p className="err" role="alert">{err}</p>}
      {items === null ? <p className="muted">Loading...</p> : items.length === 0 ? <p>No slides yet.</p> : items.map((s, i) => (
        <div className="arow" key={s.id}>
          <div className="ph">{(s.kind === "video" ? s.posterUrl : s.imageUrl) ? <img src={s.kind === "video" ? s.posterUrl : s.imageUrl} alt="" /> : <i />}</div>
          <div><b>{s.title || (s.kind === "video" ? "Video slide" : "Picture slide")}</b>
            <div className="acts" style={{ margin: "4px 0" }}><span className={"tag " + (state(s) === "Live now" ? "g" : "")}>{state(s)}</span><span className="tag">{s.kind === "video" ? "Video" : "Picture"}</span></div>
            <div className="acts">
              <button className="btn o sm fit" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button><button className="btn o sm fit" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
              <button className="btn o sm fit" onClick={() => setF({ id: s.id, title: s.title, kind: s.kind, imageUrl: s.imageUrl, imageWideUrl: s.imageWideUrl, videoUrl: s.videoUrl, posterUrl: s.posterUrl, href: s.href, active: s.active, startsAt: toLocal(s.startsAt), endsAt: toLocal(s.endsAt) })}>Edit</button>
              <button className="btn o sm fit" onClick={async () => { try { await api("hero-slides", { method: "POST", body: { ...s, active: !s.active } }); load(); } catch (e) { setErr((e as Error).message); } }}>{s.active ? "Switch off" : "Switch on"}</button>
              <button className="btn red sm fit" onClick={async () => { if (confirm("Delete this slide permanently? Switch it off instead to keep it for later.")) { await api("hero-slides", { method: "DELETE", query: `id=${s.id}` }); load(); } }}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
