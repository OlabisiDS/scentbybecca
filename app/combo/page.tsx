"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock, Shuffle, Unlock } from "lucide-react";
import { Pic } from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/config";
import { useCart } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Product, addLine, firstAvail, isOut } from "@/lib/types";
import { ngn, waLink } from "@/lib/util";

const CHOICES = CATEGORIES.filter((c) => !["perfume-combos", "gift-sets"].includes(c.slug));
const pickN = <T,>(a: T[], n: number) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
const price = (p: Product) => firstAvail(p).price;
export default function Combo() {
  const router = useRouter();
  const { products, ready } = useStore();
  const [, setCart] = useCart();
  const [count, setCount] = useState(3), [cats, setCats] = useState<string[]>([]), [budget, setBudget] = useState(""), [aud, setAud] = useState("");
  const [slots, setSlots] = useState<Product[]>([]), [locked, setLocked] = useState<boolean[]>([]), [shuf, setShuf] = useState(false), [ver, setVer] = useState(0), [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const pool = products.filter((p) => p.combo && !isOut(p) && (!cats.length || cats.includes(p.category)) && (!aud || p.audience === aud));
  const cap = budget ? Number(budget) : Infinity;
  const draw = (need: number, keep: Product[]) => {
    const room = cap - keep.reduce((a, p) => a + price(p), 0), cand = pool.filter((p) => !keep.some((k) => k.id === p.id));
    for (let i = 0; i < 300; i++) { const c = pickN(cand, need); if (c.length === need && c.reduce((a, p) => a + price(p), 0) <= room) return c; }
    return null;
  };
  const curate = () => {
    setMsg(""); const keep = slots.filter((_, i) => locked[i]), got = draw(count - keep.length, keep);
    if (!got) { setMsg(pool.length < count ? "Not enough fragrances match those choices. Try more categories." : "No combination fits that budget. Try a higher budget or fewer items."); return; }
    setShuf(true); clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const it = got[Symbol.iterator](); const next: Product[] = [], lk: boolean[] = [];
      for (let i = 0; i < count; i++) { if (locked[i] && slots[i]) { next.push(slots[i]); lk.push(true); } else { next.push(it.next().value as Product); lk.push(false); } }
      setSlots(next); setLocked(lk); setShuf(false); setVer((v) => v + 1);
    }, 700);
  };
  const swap = (i: number) => { const g = draw(1, slots.filter((_, k) => k !== i)); if (!g) { setMsg("No other fragrance fits here within your choices."); return; } setSlots(slots.map((p, k) => (k === i ? g[0] : p))); setVer((v) => v + 1); };
  const total = slots.reduce((a, p) => a + price(p), 0);
  const line = (p: Product) => `- ${p.name}${firstAvail(p).label ? ` (${firstAvail(p).label})` : ""} = ${ngn(price(p))}`;
  return (
    <div className="wrap pad">
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Curate your own combo</h1>
      <p className="muted">Pick what you like and let us shuffle a combination for you. Prices are the normal prices added together. No combo discount applies.</p>
      <span className="lab">How many fragrances?</span>
      <div className="chips">{[2, 3, 4].map((n) => <button key={n} className={"chip" + (count === n ? " on" : "")} onClick={() => { setCount(n); setSlots([]); setLocked([]); }} aria-pressed={count === n}>{n} items</button>)}</div>
      <span className="lab">Draw from (leave empty for all)</span>
      <div className="chips">{CHOICES.map((c) => { const on = cats.includes(c.slug); return <button key={c.slug} className={"chip" + (on ? " on" : "")} aria-pressed={on} onClick={() => setCats(on ? cats.filter((x) => x !== c.slug) : [...cats, c.slug])}>{c.name}</button>; })}</div>
      <div className="row2"><div><label className="lab" htmlFor="bg">Highest total (optional)</label><input id="bg" className="in-t" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} placeholder="Example: 60000" /></div>
        <div><label className="lab" htmlFor="au">For</label><select id="au" value={aud} onChange={(e) => setAud(e.target.value)}><option value="">Everyone</option><option>Women</option><option>Men</option><option>Unisex</option></select></div></div>
      <button className="btn" style={{ margin: "18px 0" }} onClick={curate} disabled={!ready || shuf}><Shuffle size={18} strokeWidth={1.5} />{slots.length ? "Shuffle again" : "Curate for me"}</button>
      {msg && <p className="err" role="alert">{msg}</p>}
      <div aria-live="polite">{slots.map((p, i) => (
        <div key={p.id + ver + i} className={"slot " + (shuf && !locked[i] ? "shuf" : "flip")} style={{ animationDelay: shuf ? "0ms" : i * 120 + "ms" }}>
          <Pic p={p} />
          <div><Link href={`/products/${p.slug}`} style={{ fontWeight: 600, textDecoration: "none" }}>{p.name}</Link><div className="muted small">{firstAvail(p).label} {ngn(price(p))}</div>
            <div className="acts"><button className="btn o sm fit" aria-pressed={locked[i]} onClick={() => setLocked(locked.map((l, k) => (k === i ? !l : l)))}>{locked[i] ? <><Lock size={16} />Kept</> : <><Unlock size={16} />Keep</>}</button><button className="btn o sm fit" onClick={() => swap(i)} disabled={locked[i]}>Swap</button></div></div>
        </div>))}</div>
      {slots.length > 0 && !shuf && <>
        <p style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 600 }}><span>Total</span><span>{ngn(total)}</span></p>
        {budget && <p className="muted small">Your highest total: {ngn(Number(budget))}</p>}
        <div className="row2"><button className="btn" onClick={() => { setCart((c) => slots.reduce((acc, p) => addLine(acc, p.id, firstAvail(p).id, 1), c)); router.push("/cart"); }}>Add combo to cart</button><button className="btn o" onClick={() => window.open(waLink(`Hello ScentbyBecca, I curated this combo:\n${slots.map(line).join("\n")}\nTotal: ${ngn(total)}\nPlease confirm availability.`), "_blank", "noopener,noreferrer")}>Send on WhatsApp</button></div></>}
    </div>
  );
}
