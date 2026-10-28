/* eslint-disable @typescript-eslint/no-explicit-any */
import { CATEGORIES } from "@/lib/config";
import { json, requireAdmin, svc, uploadDataUrl } from "@/lib/server";
import { rowToOrder, rowToProduct, rowToReview } from "@/lib/types";
import { slugify } from "@/lib/util";

type Ctx = { params: { resource: string } };
const UUID = /^[0-9a-f-]{36}$/i;
const deny = () => json({ error: "Not allowed" }, 401);
const rate = (x: any) => { const n = Number(x); return x === null || x === "" || x === undefined || !(n >= 1 && n <= 10) ? null : Math.round(n); };

function cleanProduct(b: any) {
  const name = String(b.name || "").trim();
  if (name.length < 2 || name.length > 100) throw new Error("Enter the perfume name (2 to 100 characters).");
  const category = String(b.category || ""), cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) throw new Error("Choose a category.");
  const sub = String(b.sub || ""); if (sub && !cat.subs?.some((s) => s.slug === sub)) throw new Error("Choose a valid sub-section.");
  const variants = (Array.isArray(b.variants) ? b.variants : []).slice(0, 12).map((v: any, i: number) => ({ id: String(v.id || "v" + (i + 1)).slice(0, 20), label: String(v.label || "").trim().slice(0, 40), price: Math.round(Number(v.price)), available: v.available !== false }));
  if (!variants.length || variants.some((v: any) => !isFinite(v.price) || v.price < 0)) throw new Error("Enter a valid price in naira.");
  const images = (Array.isArray(b.images) ? b.images : []).filter((s: any) => typeof s === "string" && /^(https?:\/\/|\/)/.test(s)).slice(0, 5);
  const description = String(b.description || "").trim(); if (description.length > 2000) throw new Error("The description is too long.");
  return { name, brand: String(b.brand || "").trim().slice(0, 80), category, sub, audience: ["Men", "Women", "Unisex"].includes(b.audience) ? b.audience : "", concentration: String(b.concentration || "").slice(0, 40), description, notes: String(b.notes || "").trim().slice(0, 300), longevity: rate(b.longevity), projection: rate(b.projection), sillage: rate(b.sillage), images, variants, combo: b.combo !== false, featured: b.featured === true, status: ["draft", "active", "archived"].includes(b.status) ? b.status : "draft" };
}
async function uniqueSlug(db: ReturnType<typeof svc>, name: string) {
  const base = slugify(name) || "product";
  const { data } = await db.from("products").select("slug").like("slug", base + "%");
  const taken = new Set((data || []).map((x: any) => x.slug)); let s = base, n = 2;
  while (taken.has(s)) s = `${base}-${n++}`; return s;
}

export async function GET(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const db = svc(), r = params.resource;
  if (r === "whoami") return json({ ok: true });
  if (r === "summary") {
    const [rv, od, pr] = await Promise.all([
      db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", "awaiting_payment").or("paid_claimed.eq.true,seen.eq.false"),
      db.from("products").select("variants").eq("status", "active"),
    ]);
    return json({ pendingReviews: rv.count || 0, ordersToCheck: od.count || 0, outOfStock: (pr.data || []).filter((p: any) => !p.variants.some((v: any) => v.available)).length });
  }
  if (r === "products") { const { data } = await db.from("products").select("*").order("updated_at", { ascending: false }); return json({ items: (data || []).map(rowToProduct) }); }
  if (r === "orders") { const { data } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(300); return json({ items: (data || []).map(rowToOrder) }); }
  if (r === "reviews") { const { data } = await db.from("reviews").select("*").order("created_at", { ascending: false }); return json({ items: (data || []).map(rowToReview) }); }
  if (r === "zones") { const { data } = await db.from("delivery_zones").select("*").order("sort"); return json({ items: (data || []).map((z: any) => ({ ...z, fee: Number(z.fee) })) }); }
  if (r === "banks") { const { data } = await db.from("banks").select("*"); return json({ items: data || [] }); }
  if (r === "settings") { const { data } = await db.from("settings").select("value").eq("key", "orders").maybeSingle(); return json({ value: data?.value || { paused: false, message: "" } }); }
  if (r === "shelves") { const { data } = await db.from("shelves").select("*"); return json({ items: data || [] }); }
  if (r === "covers") { const { data } = await db.from("covers").select("*"); return json({ items: data || [] }); }
  if (r === "export") {
    const [p, o, rv, z, b] = await Promise.all([db.from("products").select("*"), db.from("orders").select("*"), db.from("reviews").select("*"), db.from("delivery_zones").select("*"), db.from("banks").select("*")]);
    return json({ exportedAt: new Date().toISOString(), products: p.data, orders: o.data, reviews: rv.data, delivery_zones: z.data, banks: b.data });
  }
  return json({ error: "Unknown" }, 404);
}

export async function POST(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const db = svc(), r = params.resource, b = await req.json().catch(() => ({}));
  try {
    if (r === "upload") { if (!["products", "covers"].includes(b.folder)) throw new Error("Invalid folder."); return json({ url: await uploadDataUrl(String(b.dataUrl), b.folder) }); }
    if (r === "products") {
      const row = cleanProduct(b);
      if (b.id && UUID.test(b.id)) { const { error } = await db.from("products").update({ ...row, updated_at: new Date().toISOString() }).eq("id", b.id); if (error) throw new Error("Could not save the product."); return json({ id: b.id }); }
      const { data, error } = await db.from("products").insert({ ...row, slug: await uniqueSlug(db, row.name) }).select("id").single();
      if (error) throw new Error("Could not save the product."); return json({ id: data.id });
    }
    if (r === "products-bulk") {
      let ok = 0; const errors: string[] = [];
      for (const [i, x] of (Array.isArray(b.rows) ? b.rows : []).slice(0, 300).entries()) {
        try {
          const cat = CATEGORIES.find((c) => c.slug === x.category || c.name.toLowerCase() === String(x.category || "").toLowerCase());
          const row = cleanProduct({ name: x.name, brand: x.brand, category: cat?.slug, description: x.description, variants: [{ id: "v1", label: x.size || "", price: x.price, available: true }], status: "draft" });
          const { error } = await db.from("products").insert({ ...row, slug: await uniqueSlug(db, row.name) }); if (error) throw new Error("Could not save.");
          ok++;
        } catch (e) { errors.push(`Row ${i + 2}: ${(e as Error).message}`); }
      }
      return json({ ok, errors });
    }
  } catch (e) { return json({ error: (e as Error).message }, 400); }
  return json({ error: "Unknown" }, 404);
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const db = svc(), r = params.resource, b = await req.json().catch(() => ({}));
  try {
    if (r === "zones" || r === "banks") {
      const table = r === "zones" ? "delivery_zones" : "banks";
      const list = (Array.isArray(b.items) ? b.items : []).slice(0, 50);
      const rows = list.map((x: any, i: number) => r === "zones"
        ? { ...(UUID.test(x.id || "") ? { id: x.id } : {}), name: String(x.name || "").trim().slice(0, 60), fee: Math.max(0, Math.round(Number(x.fee) || 0)), enabled: !!x.enabled, sort: i }
        : { ...(UUID.test(x.id || "") ? { id: x.id } : {}), bank: String(x.bank || "").trim().slice(0, 60), name: String(x.name || "").trim().slice(0, 80), number: String(x.number || "").replace(/\D/g, "").slice(0, 20), active: !!x.active });
      if (rows.some((x: any) => (r === "zones" ? !x.name : !x.bank || !x.name || x.number.length < 10))) throw new Error(r === "zones" ? "Every location needs a name." : "Every bank needs a name, an account name and a 10 digit account number.");
      const { data: have } = await db.from(table).select("id"); const keep = new Set(rows.filter((x: any) => x.id).map((x: any) => x.id));
      const gone = (have || []).map((x: any) => x.id).filter((id: string) => !keep.has(id));
      if (gone.length) await db.from(table).delete().in("id", gone);
      const withId = rows.filter((x: any) => x.id), noId = rows.filter((x: any) => !x.id);
      if (withId.length) { const { error } = await db.from(table).upsert(withId); if (error) throw new Error("Could not save."); }
      if (noId.length) { const { error } = await db.from(table).insert(noId); if (error) throw new Error("Could not save."); }
      return json({ ok: true });
    }
    if (r === "settings") { await db.from("settings").upsert({ key: "orders", value: { paused: !!b.paused, message: String(b.message || "").slice(0, 200) } }); return json({ ok: true }); }
    if (r === "shelves") { await db.from("shelves").upsert({ key: String(b.key).slice(0, 60), ids: (b.ids || []).map(String).slice(0, 200) }); return json({ ok: true }); }
    if (r === "covers") { await db.from("covers").upsert({ category: String(b.category).slice(0, 60), images: (b.images || []).filter((s: any) => typeof s === "string").slice(0, 3) }); return json({ ok: true }); }
  } catch (e) { return json({ error: (e as Error).message }, 400); }
  return json({ error: "Unknown" }, 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const db = svc(), r = params.resource, b = await req.json().catch(() => ({}));
  if (!UUID.test(b.id || "") && r !== "reviews-seen" && r !== "orders-seen") return json({ error: "Invalid" }, 400);
  if (r === "orders") {
    const p: any = {};
    if (["awaiting_payment", "paid", "dispatched", "delivered", "cancelled"].includes(b.status)) p.status = b.status;
    if (b.deliveryFee === null || Number.isFinite(Number(b.deliveryFee))) p.delivery_fee = b.deliveryFee === null ? null : Math.max(0, Math.round(Number(b.deliveryFee)));
    if (typeof b.seen === "boolean") p.seen = b.seen;
    await db.from("orders").update(p).eq("id", b.id); return json({ ok: true });
  }
  if (r === "reviews") {
    const p: any = {};
    if (["pending", "visible", "hidden"].includes(b.status)) p.status = b.status;
    if (typeof b.reply === "string") p.reply = b.reply.slice(0, 800);
    await db.from("reviews").update(p).eq("id", b.id); return json({ ok: true });
  }
  if (r === "reviews-seen") { await db.from("reviews").update({ seen: true }).eq("seen", false); return json({ ok: true }); }
  if (r === "orders-seen") { await db.from("orders").update({ seen: true }).eq("seen", false); return json({ ok: true }); }
  return json({ error: "Unknown" }, 404);
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return json({ error: "Invalid" }, 400);
  const db = svc();
  if (params.resource === "products") { await db.from("products").delete().eq("id", id); return json({ ok: true }); }
  if (params.resource === "reviews") { await db.from("reviews").delete().eq("id", id); return json({ ok: true }); }
  return json({ error: "Unknown" }, 404);
}
