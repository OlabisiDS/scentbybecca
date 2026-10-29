"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { useStore } from "@/lib/store";
import type { Promotion } from "@/lib/types";

type P = Pick<Promotion, "headline" | "body" | "ctaLabel" | "ctaHref" | "imageUrl">;
export function Cta({ p, className = "btn fit", onClick }: { p: P; className?: string; onClick?: () => void }) {
  if (!p.ctaLabel) return null;
  const href = p.ctaHref || "/shop";
  return /^https?:/.test(href) ? <a className={className} href={href} target="_blank" rel="noopener noreferrer">{p.ctaLabel}</a> : <Link className={className} href={href} onClick={onClick}>{p.ctaLabel}</Link>;
}
export function PromoCard({ p }: { p: P }) {
  return (
    <div className="promo" style={p.imageUrl ? { backgroundImage: `linear-gradient(90deg,rgba(23,21,18,.85),rgba(23,21,18,.3)),url(${p.imageUrl})` } : undefined}>
      <div className="pin"><div className="pe">Special offer</div><h2>{p.headline}</h2>{p.body && <p>{p.body}</p>}<Cta p={p} /></div>
    </div>
  );
}
export function PromoBarView({ p }: { p: P }) {
  return <div className="pbar" role="region" aria-label="Offer">{p.headline}{p.body ? ` ${p.body}` : ""}{p.ctaLabel && <Cta p={p} className="" />}</div>;
}
export function PromoBar() { const { promos } = useStore(); const p = promos.find((x) => x.placement === "bar"); return p ? <PromoBarView p={p} /> : null; }
export function PromoBanner() { const { promos } = useStore(); const p = promos.find((x) => x.placement === "banner"); return p ? <PromoCard p={p} /> : null; }
export function PromoPopup() {
  const { promos } = useStore(); const path = usePathname();
  const p = promos.find((x) => x.placement === "popup");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!p || path !== "/") return;
    try { if (sessionStorage.getItem("sbb_popup_" + p.id)) return; } catch { /* ignore */ }
    const t = setTimeout(() => setOpen(true), 1200); return () => clearTimeout(t);
  }, [p, path]);
  if (!p || !open) return null;
  const close = () => { try { sessionStorage.setItem("sbb_popup_" + p.id, "1"); } catch { /* ignore */ } setOpen(false); };
  return <Sheet title="Special offer" onClose={close}><h2 style={{ fontSize: 22, marginBottom: 8 }}>{p.headline}</h2>{p.body && <p>{p.body}</p>}<Cta p={p} className="btn" onClick={close} /></Sheet>;
}
