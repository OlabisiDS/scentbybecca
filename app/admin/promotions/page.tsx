/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAdmin } from "@/components/AdminShell";
import { PromoBarView, PromoCard } from "@/components/Promos";
import { readImage } from "@/lib/image";
import { Promotion, promoLive } from "@/lib/types";

const toLocal = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
type F = { id?: string; headline: string; body: string; ctaLabel: string; ctaHref: string; imageUrl: string; placement: "bar" | "banner" | "popup"; discountPercent: string; startsAt: string; endsAt: string; active: boolean };
const blank: F = { headline: "", body: "", ctaLabel: "Shop now", ctaHref: "/shop", imageUrl: "", placement: "banner", discountPercent: "0", startsAt: "", endsAt: "", active: false };
const state = (p: Promotion) => (!p.active ? "Switched off" : promoLive(p) ? "Live now" : p.startsAt && Date.parse(p.startsAt) > Date.now() ? "Scheduled" : "Expired");
export default function Promotions() {
  const { api } = useAdmin();
  const [items, setItems] = useState<Promotion[] | null>(null), [f, setF] = useState<F | null>(null), [msg, setMsg] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const load = useCallback(() => api("promotions").then((j) => setItems(j.items)).catch((e) => setErr(e.message)), [api]);
  useEffect(() => { load(); }, [load]);
  const body = (x: F) => ({ ...x, discountPercent: Number(x.discountPercent) || 0, startsAt: fromLocal(x.startsAt), endsAt: fromLocal(x.endsAt) });
  const save = async () => { setBusy(true); setErr(""); try { await api("promotions", { method: "POST", body: body(f!) }); setF(null); setMsg("Promotion saved."); setTimeout(() => setMsg(""), 3000); load(); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  const edit = (p: Promotion) => setF({ id: p.id, headline: p.headline, body: p.body, ctaLabel: p.ctaLabel, ctaHref: p.ctaHref, imageUrl: p.imageUrl, placement: p.placement, discountPercent: String(p.discountPercent), startsAt: toLocal(p.startsAt), endsAt: toLocal(p.endsAt), active: p.active });
  if (f) {
    const set = (p: Partial<F>) => setF({ ...f, ...p });
    return (
      <>
        <h1>{f.id ? "Edit promotion" : "New promotion"}</h1>
        <label className="lab" htmlFor="hl">Headline *</label><input id="hl" className="in-t" maxLength={120} value={f.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Example: 10% off every order this season" />
        <label className="lab" htmlFor="bd">Supporting text (optional)</label><input id="bd" className="in-t" maxLength={300} value={f.body} onChange={(e) => set({ body: e.target.value })} />
        <div className="row2"><div><label className="lab" htmlFor="cl">Button label</label><input id="cl" className="in-t" maxLength={40} value={f.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} /></div><div><label className="lab" htmlFor="ch">Button goes to</label><input id="ch" className="in-t" value={f.ctaHref} onChange={(e) => set({ ctaHref: e.target.value })} placeholder="/shop" /></div></div>
        <label className="lab" htmlFor="pl">Where it appears</label>
        <select id="pl" value={f.placement} onChange={(e) => set({ placement: e.target.value as F["placement"] })}><option value="banner">Banner at the top of the home page</option><option value="bar">Slim strip above the header, on every page</option><option value="popup">Pop-up once per visit on the home page</option></select>
        <label className="lab" htmlFor="dp">Discount percentage (0 for none)</label><input id="dp" className="in-t" inputMode="numeric" value={f.discountPercent} onChange={(e) => set({ discountPercent: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
        <p className="hint">When above 0 and the promotion is live, this percentage comes off the product subtotal at checkout. Only the best live discount applies, never two together.</p>
        <div className="row2"><div><label className="lab" htmlFor="st">Starts (optional)</label><input id="st" className="in-t" type="datetime-local" value={f.startsAt} onChange={(e) => set({ startsAt: e.target.value })} /></div><div><label className="lab" htmlFor="en">Ends (optional)</label><input id="en" className="in-t" type="datetime-local" value={f.endsAt} onChange={(e) => set({ endsAt: e.target.value })} /></div></div>
        <span className="lab">Image (optional)</span>
        {f.imageUrl && <div style={{ maxWidth: 240 }}><div className="ph" style={{ aspectRatio: "2/1" }}><img src={f.imageUrl} alt="Promotion image" /></div><button className="btn red sm fit" onClick={() => set({ imageUrl: "" })}>Remove image</button></div>}
        <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose promotion image" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { set({ imageUrl: (await api("upload", { method: "POST", body: { dataUrl: await readImage(file, 1400), folder: "promos" } })).url }); setErr(""); } catch (x) { setErr((x as Error).message); } }} />
        <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0", minHeight: 44 }}><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} style={{ width: 22, height: 22 }} />Switched on (still only shows between the start and end dates)</label>
        <h2 style={{ fontSize: 14, margin: "12px 0 4px" }}>Preview</h2>
        <div className="preview">{f.headline.trim().length < 2 ? <p className="muted small">Type a headline to see the preview.</p> : f.placement === "bar" ? <PromoBarView p={f} /> : f.placement === "popup" ? <div style={{ padding: 12 }}><h2 style={{ fontSize: 20, marginBottom: 6 }}>{f.headline}</h2>{f.body && <p>{f.body}</p>}{f.ctaLabel && <span className="btn fit">{f.ctaLabel}</span>}</div> : <PromoCard p={f} />}</div>
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row2"><button className="btn o" onClick={() => { setF(null); setErr(""); }}>Cancel</button><button className="btn" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save promotion"}</button></div>
      </>
    );
  }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}><h1 style={{ margin: 0 }}>Promotions</h1><button className="btn fit" onClick={() => setF(blank)}><Plus size={18} />New promotion</button></div>
      <p className="muted small">Banners, strips and pop-ups for offers. A promotion with a discount percentage really reduces the price at checkout while it is live. Expired promotions stop showing on their own and stay here so you can reuse them.</p>
      {msg && <div className="fb" role="status">{msg}</div>}{err && <p className="err" role="alert">{err}</p>}
      {items === null ? <p className="muted">Loading...</p> : items.length === 0 ? <p>No promotions yet.</p> : items.map((p) => (
        <div className="cardx" key={p.id}>
          <b>{p.headline}</b>
          <div className="acts" style={{ margin: "6px 0" }}><span className={"tag " + (state(p) === "Live now" ? "g" : "")}>{state(p)}</span><span className="tag">{p.placement === "bar" ? "Strip" : p.placement === "popup" ? "Pop-up" : "Banner"}</span>{p.discountPercent > 0 && <span className="tag">{p.discountPercent}% off</span>}</div>
          <div className="small muted">{p.startsAt ? `From ${new Date(p.startsAt).toLocaleString()}` : "No start date"} | {p.endsAt ? `Until ${new Date(p.endsAt).toLocaleString()}` : "No end date"}</div>
          <div className="acts"><button className="btn o sm fit" onClick={() => edit(p)}>Edit</button>
            <button className="btn o sm fit" onClick={async () => { try { await api("promotions", { method: "POST", body: { ...body({ id: p.id, headline: p.headline, body: p.body, ctaLabel: p.ctaLabel, ctaHref: p.ctaHref, imageUrl: p.imageUrl, placement: p.placement, discountPercent: String(p.discountPercent), startsAt: toLocal(p.startsAt), endsAt: toLocal(p.endsAt), active: !p.active }) } }); load(); } catch (e) { setErr((e as Error).message); } }}>{p.active ? "Switch off" : "Switch on"}</button>
            <button className="btn red sm fit" onClick={async () => { if (confirm("Delete this promotion permanently? Switch it off instead to keep it for later.")) { await api("promotions", { method: "DELETE", query: `id=${p.id}` }); load(); } }}>Delete</button></div>
        </div>
      ))}
    </>
  );
}
