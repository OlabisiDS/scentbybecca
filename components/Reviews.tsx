"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import Lightbox from "./Lightbox";
import PageHeader from "./PageHeader";
import Sheet from "./Sheet";
import { readImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import { sortReviews, type Review } from "@/lib/types";

export function Stars({ value }: { value: number }) {
  return <span role="img" aria-label={`${value} out of 5 stars`} style={{ display: "inline-flex", gap: 2, color: "var(--gold)" }}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={18} strokeWidth={1.5} fill={i <= value ? "currentColor" : "none"} />)}</span>;
}
export function ReviewCard({ r }: { r: Review }) {
  const [lb, setLb] = useState<number | null>(null);
  return (
    <article className="rev">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><b>{r.name}</b><Stars value={r.rating} /></div>
      <p style={{ margin: "8px 0" }}>{r.text}</p>
      {r.images.length > 0 && <div className="rimgs">{r.images.map((s, i) => <button key={i} onClick={() => setLb(i)} aria-label={`Enlarge photo ${i + 1} from ${r.name}`} style={{ border: 0, padding: 0, background: "none", cursor: "zoom-in" }}><img src={s} alt={`Photo shared by ${r.name}`} loading="lazy" /></button>)}</div>}
      {r.reply && <div className="rrep"><b className="small">Reply from ScentbyBecca</b><p style={{ margin: "4px 0 0" }}>{r.reply}</p></div>}
      {lb !== null && <Lightbox images={r.images} start={lb} onClose={() => setLb(null)} />}
    </article>
  );
}
function Form({ target, onClose }: { target: string; onClose: () => void }) {
  const [name, setName] = useState(""), [rating, setRating] = useState(0), [text, setText] = useState(""), [imgs, setImgs] = useState<string[]>([]), [hp, setHp] = useState("");
  const [err, setErr] = useState(""), [ok, setOk] = useState(false), [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files) return; const list = [...imgs];
    for (const f of Array.from(files)) { if (list.length >= 3) { setErr("You can add up to 3 photos."); break; } try { list.push(await readImage(f, 800)); setErr(""); } catch (x) { setErr((x as Error).message); } }
    setImgs(list);
  };
  const submit = async () => {
    if (name.trim().length < 2) return setErr("Please enter your name.");
    if (rating < 1) return setErr("Please choose a star rating from 1 to 5.");
    if (text.trim().length < 10) return setErr("Please write a little more about your experience (at least 10 characters).");
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, name, rating, text, images: imgs, website: hp }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Could not send your review.");
      setOk(true);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  if (ok) return <div><div className="fb" role="status">Thank you. Your review will appear once ScentbyBecca approves it.</div><button className="btn" onClick={onClose}>Close</button></div>;
  return (
    <div>
      <label className="lab" htmlFor="rn">Your name</label><input id="rn" className="in-t" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <span className="lab">Your rating</span>
      <div style={{ display: "flex", gap: 4 }}>{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" className="ib" aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={rating === i} onClick={() => setRating(i)} style={{ color: "var(--gold)" }}><Star size={28} strokeWidth={1.5} fill={i <= rating ? "currentColor" : "none"} /></button>)}</div>
      <label className="lab" htmlFor="rt">Your review</label><textarea id="rt" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: "absolute", left: -9999 }} name="website" />
      <label className="lab" htmlFor="ri">Add up to 3 photos (optional)</label>
      <input id="ri" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {imgs.length > 0 && <div className="rimgs" style={{ margin: "8px 0" }}>{imgs.map((s, i) => <div key={i}><img src={s} alt={`Preview ${i + 1}`} style={{ width: 90, height: 90, objectFit: "cover" }} /><button type="button" className="btn red sm fit" onClick={() => setImgs(imgs.filter((_, k) => k !== i))}>Remove</button></div>)}</div>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" style={{ marginTop: 14 }} onClick={submit} disabled={busy}>{busy ? "Sending..." : "Post review"}</button>
    </div>
  );
}
export function WriteReview({ target, label = "Write a review" }: { target: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return <><button className="btn o" onClick={() => setOpen(true)}>{label}</button>{open && <Sheet title="Write a review" onClose={() => setOpen(false)}><Form target={target} onClose={() => setOpen(false)} /></Sheet>}</>;
}
const pub = (l: Review[], target: string) => sortReviews(l.filter((r) => r.target === target));
export function ReviewsPage() {
  const { reviews, ready } = useStore();
  const vis = pub(reviews, "store");
  return (
    <>
      <PageHeader title="Customer reviews" pageKey="reviews" crumb="Reviews" />
      <div className="wrap pad"><div style={{ marginBottom: 14, maxWidth: 320 }}><WriteReview target="store" /></div>{!ready ? <p className="muted">Loading...</p> : vis.length === 0 ? <p className="muted">No reviews yet.</p> : vis.map((r) => <ReviewCard key={r.id} r={r} />)}</div>
    </>
  );
}
function Tile({ r }: { r: Review }) {
  const [lb, setLb] = useState<number | null>(null);
  return (
    <article className="rcard">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><span className="av" aria-hidden="true">{r.name.charAt(0).toUpperCase()}</span><div><b style={{ font: "700 18px var(--display)" }}>{r.name}</b><div><Stars value={r.rating} /></div></div></div>
      <p style={{ margin: "0 0 10px", flex: 1 }}>{r.text}</p>
      {r.images.length > 0 && <div className="rimgs">{r.images.map((s, i) => <button key={i} onClick={() => setLb(i)} aria-label={`Enlarge photo ${i + 1} from ${r.name}`} style={{ border: 0, padding: 0, background: "none", cursor: "zoom-in" }}><img src={s} alt={`Photo shared by ${r.name}`} loading="lazy" style={{ width: 64, height: 64 }} /></button>)}</div>}
      {r.reply && <div className="rrep"><b className="small">Reply from ScentbyBecca</b><p style={{ margin: "4px 0 0" }}>{r.reply}</p></div>}
      {lb !== null && <Lightbox images={r.images} start={lb} onClose={() => setLb(null)} />}
    </article>
  );
}
// Home page review slider: the pinned reviews come first, in the order set in Admin > Reviews.
export function ReviewsSection() {
  const { reviews, ready } = useStore();
  const vis = pub(reviews, "store"), ref = useRef<HTMLDivElement>(null), [paused, setPaused] = useState(false);
  useEffect(() => {
    if (vis.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { const el = ref.current; if (!el || !el.firstElementChild) return; const step = (el.firstElementChild as HTMLElement).offsetWidth + 12; if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({ left: 0, behavior: "smooth" }); else el.scrollBy({ left: step, behavior: "smooth" }); }, 5500);
    return () => clearInterval(t);
  }, [vis.length, paused]);
  if (!ready || vis.length === 0) return null;
  const avg = vis.reduce((a, r) => a + r.rating, 0) / vis.length;
  return (
    <section className="wrap sec" style={{ paddingBottom: 28 }}>
      <h2>What customers say</h2>
      <div className="rsum"><div className="big">Customer reviews</div><div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}><Stars value={Math.round(avg)} /></div><div className="small muted">Rated {avg.toFixed(1)} out of 5 from {vis.length} review{vis.length === 1 ? "" : "s"}</div></div>
      <div className="rc-row" ref={ref} onTouchStart={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>{vis.map((r) => <Tile key={r.id} r={r} />)}</div>
      <div className="row2" style={{ marginTop: 8 }}><Link className="btn o" href="/info/reviews">See all reviews</Link><WriteReview target="store" /></div>
    </section>
  );
}
export function ProductReviews({ productId, bare }: { productId: string; bare?: boolean }) {
  const { reviews, ready } = useStore();
  const vis = pub(reviews, productId);
  const inner = (<>
    {ready && vis.length === 0 && <p className="muted">No reviews for this fragrance yet.</p>}
    {vis.map((r) => <ReviewCard key={r.id} r={r} />)}
    <div style={{ maxWidth: 320, marginTop: 10 }}><WriteReview target={productId} /></div></>);
  return bare ? <div>{inner}</div> : <section className="sec"><h2>Reviews for this fragrance</h2>{inner}</section>;
}
