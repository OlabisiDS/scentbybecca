import { WHATSAPP_NUMBER } from "./config";
export const ngn = (n: number) => "\u20A6" + Math.round(n).toLocaleString("en-NG");
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
export const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
export const waPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("234") ? d : d.startsWith("0") ? "234" + d.slice(1) : d; };
export const rankBy = <T extends { id: string; createdAt: number }>(list: T[], ids: string[] = []) =>
  [...list].sort((a, b) => { const x = ids.indexOf(a.id), y = ids.indexOf(b.id); if (x >= 0 || y >= 0) return (x < 0 ? 1e9 : x) - (y < 0 ? 1e9 : y); return b.createdAt - a.createdAt; });
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
