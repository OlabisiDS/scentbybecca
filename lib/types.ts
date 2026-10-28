export type Variant = { id: string; label: string; price: number; available: boolean };
export type Status = "draft" | "active" | "archived";
export const CONCENTRATIONS = ["Extrait de Parfum", "Eau de Parfum", "Eau de Toilette", "Eau de Cologne", "Perfume oil", "Body mist", "Other"];
export type Product = {
  id: string; slug: string; name: string; brand: string; category: string; sub: string; audience: "" | "Men" | "Women" | "Unisex";
  concentration: string; description: string; notes: string; longevity: number | null; projection: number | null; sillage: number | null;
  images: string[]; variants: Variant[]; combo: boolean; featured: boolean; status: Status; createdAt: number; updatedAt: number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToProduct = (r: any): Product => ({ id: r.id, slug: r.slug, name: r.name, brand: r.brand, category: r.category, sub: r.sub, audience: r.audience, concentration: r.concentration, description: r.description, notes: r.notes, longevity: r.longevity, projection: r.projection, sillage: r.sillage, images: r.images || [], variants: r.variants || [], combo: r.combo, featured: r.featured, status: r.status, createdAt: Date.parse(r.created_at), updatedAt: Date.parse(r.updated_at) });
export const isOut = (p: Product) => !p.variants.some((v) => v.available);
export const firstAvail = (p: Product) => p.variants.find((v) => v.available) ?? p.variants[0];
export const fromPrice = (p: Product) => { const l = p.variants.filter((v) => v.available); return Math.min(...(l.length ? l : p.variants).map((v) => v.price)); };
export const multiPrice = (p: Product) => p.variants.length > 1 && new Set(p.variants.map((v) => v.price)).size > 1;

export type Review = { id: string; target: string; name: string; rating: number; text: string; images: string[]; status: "pending" | "visible" | "hidden"; reply: string; seen: boolean; createdAt: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToReview = (r: any): Review => ({ id: r.id, target: r.target, name: r.name, rating: r.rating, text: r.text, images: r.images || [], status: r.status, reply: r.reply, seen: r.seen, createdAt: Date.parse(r.created_at) });
export type Zone = { id: string; name: string; fee: number; enabled: boolean; sort: number };
export type Bank = { id: string; bank: string; name: string; number: string; active: boolean };
export type OrderStatus = "awaiting_payment" | "paid" | "dispatched" | "delivered" | "cancelled";
export const STATUS_LABEL: Record<OrderStatus, string> = { awaiting_payment: "Awaiting payment", paid: "Paid", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled" };
export type OrderItem = { pid: string; vid: string; name: string; variant: string; price: number; qty: number };
export type Order = { id: string; number: string; items: OrderItem[]; subtotal: number; zone: string; deliveryFee: number | null; name: string; phone: string; address: string; notes: string; status: OrderStatus; paidClaimed: boolean; seen: boolean; createdAt: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToOrder = (r: any): Order => ({ id: r.id, number: r.number, items: r.items, subtotal: Number(r.subtotal), zone: r.zone, deliveryFee: r.delivery_fee === null ? null : Number(r.delivery_fee), name: r.name, phone: r.phone, address: r.address, notes: r.notes, status: r.status, paidClaimed: r.paid_claimed, seen: r.seen, createdAt: Date.parse(r.created_at) });
export const orderTotal = (o: Order) => o.subtotal + (o.deliveryFee ?? 0);
export type CartLine = { pid: string; vid: string; qty: number };
export const addLine = (c: CartLine[], pid: string, vid: string, qty: number) => {
  const l = c.find((x) => x.pid === pid && x.vid === vid); const q = Math.min(20, (l ? l.qty : 0) + qty);
  return l ? c.map((x) => (x === l ? { ...x, qty: q } : x)) : [...c, { pid, vid, qty: q }];
};
