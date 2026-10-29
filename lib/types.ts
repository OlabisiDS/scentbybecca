export type Variant = { id: string; label: string; price: number; available: boolean };
export type Status = "draft" | "active" | "archived";
export const CONCENTRATIONS = ["Extrait de Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne", "Perfume oil", "Body mist", "Other"];
export const GRADES = ["Fair", "Moderate", "Good", "Very Good", "Excellent"];
export type Product = {
  id: string; slug: string; name: string; brand: string; category: string; sub: string; audience: "" | "Men" | "Women" | "Unisex";
  concentration: string; description: string; notes: string; ratingMode: "number" | "grade";
  longevity: number | null; projection: number | null; sillage: number | null; longevityGrade: string; projectionGrade: string; sillageGrade: string;
  images: string[]; variants: Variant[]; combo: boolean; featured: boolean; status: Status; createdAt: number; updatedAt: number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToProduct = (r: any): Product => ({ id: r.id, slug: r.slug, name: r.name, brand: r.brand, category: r.category, sub: r.sub, audience: r.audience, concentration: r.concentration, description: r.description, notes: r.notes, ratingMode: r.rating_mode === "grade" ? "grade" : "number", longevity: r.longevity, projection: r.projection, sillage: r.sillage, longevityGrade: r.longevity_grade || "", projectionGrade: r.projection_grade || "", sillageGrade: r.sillage_grade || "", images: r.images || [], variants: r.variants || [], combo: r.combo, featured: r.featured, status: r.status, createdAt: Date.parse(r.created_at), updatedAt: Date.parse(r.updated_at) });
export const isOut = (p: Product) => !p.variants.some((v) => v.available);
export const firstAvail = (p: Product) => p.variants.find((v) => v.available) ?? p.variants[0];
export const fromPrice = (p: Product) => { const l = p.variants.filter((v) => v.available); return Math.min(...(l.length ? l : p.variants).map((v) => v.price)); };
export const multiPrice = (p: Product) => p.variants.length > 1 && new Set(p.variants.map((v) => v.price)).size > 1;
export const ratingText = (p: Product, k: "longevity" | "projection" | "sillage") => {
  if (p.ratingMode === "grade") return (k === "longevity" ? p.longevityGrade : k === "projection" ? p.projectionGrade : p.sillageGrade) || "-";
  const n = p[k]; return n ? `${n}/10` : "-";
};

export type Review = { id: string; target: string; name: string; rating: number; text: string; images: string[]; status: "pending" | "visible" | "hidden"; reply: string; seen: boolean; createdAt: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToReview = (r: any): Review => ({ id: r.id, target: r.target, name: r.name, rating: r.rating, text: r.text, images: r.images || [], status: r.status, reply: r.reply, seen: r.seen, createdAt: Date.parse(r.created_at) });
export type Area = { id: string; zoneId: string; name: string; fee: number | null; enabled: boolean; sort: number };
export type Zone = { id: string; name: string; fee: number; enabled: boolean; sort: number; areas: Area[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToArea = (a: any): Area => ({ id: a.id, zoneId: a.zone_id, name: a.name, fee: a.fee === null ? null : Number(a.fee), enabled: a.enabled, sort: a.sort });
export type Bank = { id: string; bank: string; name: string; number: string; active: boolean };
export type OrderStatus = "awaiting_payment" | "paid" | "dispatched" | "delivered" | "cancelled";
export const STATUS_LABEL: Record<OrderStatus, string> = { awaiting_payment: "Awaiting payment", paid: "Payment confirmed", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled" };
export type OrderItem = { pid: string; vid: string; name: string; variant: string; price: number; qty: number };
export type Order = {
  id: string; number: string; items: OrderItem[]; subtotal: number; zone: string; area: string; requestedArea: string; deliveryFee: number | null; feePending: boolean;
  discount: number; discountPercent: number; promoTitle: string; name: string; phone: string; email: string; address: string; notes: string;
  status: OrderStatus; paidClaimed: boolean; paidReportedAt: number | null; seen: boolean; createdAt: number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToOrder = (r: any): Order => ({ id: r.id, number: r.number, items: r.items, subtotal: Number(r.subtotal), zone: r.zone, area: r.area || "", requestedArea: r.requested_area || "", deliveryFee: r.delivery_fee === null ? null : Number(r.delivery_fee), feePending: !!r.fee_pending, discount: Number(r.discount || 0), discountPercent: Number(r.discount_percent || 0), promoTitle: r.promo_title || "", name: r.name, phone: r.phone, email: r.email || "", address: r.address, notes: r.notes, status: r.status, paidClaimed: r.paid_claimed, paidReportedAt: r.paid_reported_at ? Date.parse(r.paid_reported_at) : null, seen: r.seen, createdAt: Date.parse(r.created_at) });
export const orderTotal = (o: Order) => o.subtotal - o.discount + (o.deliveryFee ?? 0);
export type Promotion = { id: string; headline: string; body: string; ctaLabel: string; ctaHref: string; imageUrl: string; placement: "bar" | "banner" | "popup"; discountPercent: number; startsAt: string | null; endsAt: string | null; active: boolean; createdAt: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToPromo = (r: any): Promotion => ({ id: r.id, headline: r.headline, body: r.body, ctaLabel: r.cta_label, ctaHref: r.cta_href, imageUrl: r.image_url, placement: r.placement, discountPercent: r.discount_percent, startsAt: r.starts_at, endsAt: r.ends_at, active: r.active, createdAt: Date.parse(r.created_at) });
export const promoLive = (p: Promotion, now = Date.now()) => p.active && (!p.startsAt || Date.parse(p.startsAt) <= now) && (!p.endsAt || Date.parse(p.endsAt) >= now);
export type HeroVideo = { id: string; title: string; videoUrl: string; posterUrl: string; active: boolean; createdAt: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToVideo = (r: any): HeroVideo => ({ id: r.id, title: r.title, videoUrl: r.video_url, posterUrl: r.poster_url, active: r.active, createdAt: Date.parse(r.created_at) });
export type CartLine = { pid: string; vid: string; qty: number };
export const addLine = (c: CartLine[], pid: string, vid: string, qty: number) => {
  const l = c.find((x) => x.pid === pid && x.vid === vid); const q = Math.min(20, (l ? l.qty : 0) + qty);
  return l ? c.map((x) => (x === l ? { ...x, qty: q } : x)) : [...c, { pid, vid, qty: q }];
};
