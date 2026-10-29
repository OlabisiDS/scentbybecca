import type { Promotion } from "./types";
import { ngn } from "./util";
// One calculation used by the cart, the server, the saved order and the WhatsApp message.
export const bestPromo = (ps: Promotion[]) => [...ps].filter((p) => p.discountPercent > 0).sort((a, b) => b.discountPercent - a.discountPercent)[0] || null;
export const calc = (subtotal: number, pct: number, fee: number | null) => {
  const discount = Math.round((subtotal * pct) / 100), items = subtotal - discount;
  return { discount, items, total: fee === null ? null : items + fee };
};
export type MsgView = {
  number?: string; items: { name: string; variant: string; qty: number; price: number }[]; subtotal: number; discount: number; discountPercent: number; promoTitle: string;
  zone: string; area: string; requestedArea: string; deliveryFee: number | null; name?: string; phone?: string; address?: string; paymentReported?: boolean; notes?: string;
};
export function buildMessage(v: MsgView) {
  const items = v.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""}: ${i.qty} x ${ngn(i.price)} = ${ngn(i.qty * i.price)}`).join("\n");
  const after = v.subtotal - v.discount, fee = v.deliveryFee;
  const L = ["SCENTBYBECCA ORDER"];
  if (v.number) L.push(`Order reference: ${v.number}`);
  L.push("", "Items:", items, "", `Product subtotal: ${ngn(v.subtotal)}`);
  if (v.discount > 0) L.push(`Discount (${v.discountPercent}% off${v.promoTitle ? `, ${v.promoTitle}` : ""}): -${ngn(v.discount)}`);
  L.push(fee === null ? "Delivery fee: to be confirmed on WhatsApp" : `Delivery fee: ${ngn(fee)}`, "");
  L.push(fee === null ? `PROVISIONAL TOTAL (delivery fee to be confirmed): ${ngn(after)}` : `TOTAL PAYABLE: ${ngn(after + fee)}`, "");
  L.push(`Delivery location: ${v.zone}`);
  if (v.area) L.push(`Area: ${v.area}`); else if (v.requestedArea) L.push(`Area requested (not on the list): ${v.requestedArea}`);
  if (v.name) L.push("", `Name: ${v.name}`);
  if (v.phone) L.push(`Phone: ${v.phone}`);
  if (v.address) L.push(`Address: ${v.address}`);
  if (v.notes) L.push(`Notes: ${v.notes}`);
  if (v.paymentReported) L.push("", "I have reported my payment on the website.");
  return L.join("\n");
}
