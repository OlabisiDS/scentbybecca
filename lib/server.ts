import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ngn, SITE } from "./util";
import { orderTotal, STATUS_LABEL, type Order } from "./types";

const url = () => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin; } catch { return ""; } };
export const svc = () => createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY || "", { auth: { persistSession: false } });
export const anonServer = () => createClient(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", { auth: { persistSession: false } });
export const json = (b: unknown, status = 200) => NextResponse.json(b, { status });
export async function requireAdmin(req: Request) {
  const t = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const want = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!t || !want) return false;
  const { data } = await svc().auth.getUser(t);
  return data.user?.email?.toLowerCase() === want;
}
const hits = new Map<string, number[]>();
export function limited(req: Request, key: string, max: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const k = key + ip, now = Date.now(), list = (hits.get(k) || []).filter((t) => now - t < windowMs);
  list.push(now); hits.set(k, list); return list.length > max;
}
export async function uploadDataUrl(dataUrl: string, folder: string) {
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("That photo format is not supported.");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 2_500_000) throw new Error("A photo is too large.");
  const db = svc(), path = `${folder}/${crypto.randomUUID()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  const { error } = await db.storage.from("media").upload(path, buf, { contentType: `image/${m[1]}` });
  if (error) throw new Error("Photo upload failed.");
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// ---------- Email (Resend). Needs RESEND_API_KEY and EMAIL_FROM. Skipped quietly when not configured. ----------
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
async function sendMail(to: string, subject: string, text: string) {
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }) });
  if (!r.ok) throw new Error("Email provider refused the message.");
}
type Audience = "customer" | "admin";
export async function notify(db: ReturnType<typeof svc>, o: Order, event: string, audience: Audience) {
  if (!emailConfigured()) return;
  const to = audience === "admin" ? (process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "").trim() : o.email;
  if (!to) return;
  const key = `${event}_${audience}`;
  const { error } = await db.from("order_notifications").insert({ order_id: o.id, event: key });
  if (error) return; // already sent (or cannot log), never send twice
  const link = `${SITE}/orders/${o.id}`, total = o.feePending && o.deliveryFee === null ? `${ngn(o.subtotal - o.discount)} (delivery fee to be confirmed)` : ngn(orderTotal(o));
  const sig = `\n\nOrder reference: ${o.number}\nTrack your order: ${link}\n\nScentbyBecca`;
  const msgs: Record<string, [string, string]> = {
    "created_customer": [`We received your order ${o.number}`, `Hello ${o.name},\n\nThank you for your order. Total: ${total}.\nPlease pay by bank transfer using the details on your order page. We will confirm your payment once we see it.${sig}`],
    "created_admin": [`New order ${o.number}`, `New order from ${o.name} (${o.phone}). Total: ${total}. Location: ${o.zone}${o.area ? `, ${o.area}` : ""}.\nOpen the admin Orders page to review it.\n${link}`],
    "paid_reported_customer": [`Payment notification received for ${o.number}`, `Hello ${o.name},\n\nYour payment notification has been received by ScentbyBecca. Our team will review your payment and contact you if any further information is needed.\n\nThis is not yet a payment confirmation. You will get another message once the payment is confirmed.${sig}`],
    "paid_reported_admin": [`Customer reported payment for ${o.number}`, `${o.name} (${o.phone}) says they have paid ${total}. Check your bank app before marking the order as paid.\n${link}`],
  };
  for (const s of ["paid", "dispatched", "delivered", "cancelled"] as const) msgs[`status_${s}_customer`] = [`Order ${o.number}: ${STATUS_LABEL[s]}`, `Hello ${o.name},\n\nYour order status is now: ${STATUS_LABEL[s]}.${sig}`];
  const m = msgs[key]; if (!m) return;
  try { await sendMail(to, m[0], m[1]); } catch { await db.from("order_notifications").delete().eq("order_id", o.id).eq("event", key); }
}
