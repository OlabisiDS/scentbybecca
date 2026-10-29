import { calc } from "@/lib/calc";
import { json, limited, notify, svc } from "@/lib/server";
import { rowToOrder, type Variant } from "@/lib/types";

export async function POST(req: Request) {
  if (limited(req, "order", 10, 3_600_000)) return json({ error: "Too many orders from this connection. Please try again later." }, 429);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const name = String(b.name || "").trim().slice(0, 80), phone = String(b.phone || "").trim().slice(0, 30), address = String(b.address || "").trim().slice(0, 300), notes = String(b.notes || "").trim().slice(0, 300);
  const email = String(b.email || "").trim().slice(0, 120), requested = String(b.requestedArea || "").trim().slice(0, 80);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 10 || address.length < 8) return json({ error: "Please enter your name, a valid phone number and your full delivery address." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "That email address does not look right." }, 400);
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30) as { pid: string; vid: string; qty: number }[];
  if (!items.length) return json({ error: "Your cart is empty." }, 400);
  const db = svc();
  const { data: st } = await db.from("settings").select("value").eq("key", "orders").maybeSingle();
  if (st?.value?.paused) return json({ error: st.value.message || "Orders are paused right now. Please check back soon." }, 403);
  const { data: prods } = await db.from("products").select("*").in("id", [...new Set(items.map((i) => String(i.pid)))]).eq("status", "active");
  const out = []; let subtotal = 0;
  for (const it of items) {
    const p = prods?.find((x) => x.id === it.pid), v = (p?.variants as Variant[] | undefined)?.find((x) => x.id === it.vid), qty = Math.floor(Number(it.qty));
    if (!p || !v || !v.available || !(qty >= 1 && qty <= 20)) return json({ error: `"${p?.name || "An item"}" is no longer available. Please update your cart.` }, 409);
    out.push({ pid: p.id, vid: v.id, name: p.name, variant: v.label, price: Number(v.price), qty }); subtotal += Number(v.price) * qty;
  }
  // Delivery: location, then optional area. Unknown or unlisted areas never get an invented fee.
  let zone = "Other location", area = "", fee: number | null = null, pending = true;
  if (b.zoneId) {
    const { data: z } = await db.from("delivery_zones").select("*").eq("id", String(b.zoneId)).eq("enabled", true).maybeSingle();
    if (z) {
      zone = z.name;
      const { data: areas } = await db.from("delivery_areas").select("*").eq("zone_id", z.id).eq("enabled", true);
      if (areas?.length) {
        const a = areas.find((x) => x.id === b.areaId);
        if (a) { area = a.name; fee = a.fee === null ? Number(z.fee) : Number(a.fee); pending = false; }
        else if (requested.length < 2) return json({ error: "Please choose your area, or type your area if it is not on the list." }, 400);
      } else { fee = Number(z.fee); pending = false; }
    }
  }
  // Discount: the single best live promotion, validated here on the server.
  const now = new Date().toISOString();
  const { data: promo } = await db.from("promotions").select("headline, discount_percent").eq("active", true).gt("discount_percent", 0).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`).order("discount_percent", { ascending: false }).limit(1).maybeSingle();
  const pct = promo?.discount_percent || 0, { discount } = calc(subtotal, pct, fee);
  for (let i = 0; i < 3; i++) {
    const number = "SBB-" + Math.floor(100000 + Math.random() * 900000);
    const { data, error } = await db.from("orders").insert({ number, items: out, subtotal, zone, area, requested_area: area ? "" : requested, delivery_fee: fee, fee_pending: pending, discount, discount_percent: pct, promo_title: promo?.headline || "", name, phone, email, address, notes }).select("*").single();
    if (!error && data) {
      const o = rowToOrder(data);
      await Promise.allSettled([notify(db, o, "created", "admin"), notify(db, o, "created", "customer")]);
      return json({ id: o.id, number: o.number });
    }
  }
  return json({ error: "Could not place the order. Please try again." }, 500);
}
