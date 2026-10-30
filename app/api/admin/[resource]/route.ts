/* eslint-disable @typescript-eslint/no-explicit-any */
import { CATEGORIES } from "@/lib/config";
import { emailConfigured, json, notify, requireAdmin, svc, uploadDataUrl } from "@/lib/server";
import { GRADES, rowToSlide, rowToArea, rowToOrder, rowToProduct, rowToPromo, rowToReview, rowToVideo } from "@/lib/types";
import { slugify } from "@/lib/util";

type Ctx = { params: { resource: string } };
const UUID = /^[0-9a-f-]{36}$/i;
const deny = () => json({ error: "Not allowed" }, 401);
const rate = (x: any) => { const n = Number(x); return x === null || x === "" || x === undefined || !(n >= 1 && n <= 10) ? null : Math.round(n); };
const grade = (x: any) => (GRADES.includes(String(x)) ? String(x) : "");
const url = (x: any) => (typeof x === "string" && /^(https?:\/\/|\/)/.test(x) ? x.slice(0, 600) : "");

function cleanProduct(b: any) {
  const name = String(b.name || "").trim();
  if (name.length < 2 || name.length > 100) throw new Error("Enter the perfume name (2 to 100 characters).");
  const category = String(b.category || ""), cat = CATEGORIES.find((c) => c.slug === category);
  if (!cat) throw new Error("Choose a category.");
  const sub = String(b.sub || ""); if (sub && !cat.subs?.some((s) => s.slug === sub)) throw new Error("Choose a valid sub-section.");
  const variants = (Array.isArray(b.variants) ? b.variants : []).slice(0, 12).map((v: any, i: number) => ({ id: String(v.id || "v" + (i + 1)).slice(0, 20), label: String(v.label || "").trim().slice(0, 40), price: Math.round(Number(v.price)), available: v.available !== false }));
  if (!variants.length || variants.some((v: any) => !isFinite(v.price) || v.price < 0)) throw new Error("Enter a valid price in naira.");
  const images = (Array.isArray(b.images) ? b.images : []).filter((s: any) => typeof s === "string" && /^(https?:\/\/|\/)/.test(s)).slice(0, 5);
  const description = String(b.description || "").replace(/\r/g, "").trim(); if (description.length > 2000) throw new Error("The description is too long.");
  const notes = String(b.notes || "").replace(/\r/g, "").trim(); if (notes.length > 1000) throw new Error("The notes are too long (1000 characters at most).");
  const mode = b.ratingMode === "grade" ? "grade" : "number";
  return { name, brand: String(b.brand || "").trim().slice(0, 80), category, sub, audience: ["Men", "Women", "Unisex"].includes(b.audience) ? b.audience : "", concentration: String(b.concentration || "").slice(0, 40), description, notes, rating_mode: mode,
    longevity: mode === "number" ? rate(b.longevity) : null, projection: mode === "number" ? rate(b.projection) : null, sillage: mode === "number" ? rate(b.sillage) : null,
    longevity_grade: mode === "grade" ? grade(b.longevityGrade) : "", projection_grade: mode === "grade" ? grade(b.projectionGrade) : "", sillage_grade: mode === "grade" ? grade(b.sillageGrade) : "",
    images, variants, combo: b.combo !== false, featured: b.featured === true, status: ["draft", "active", "archived"].includes(b.status) ? b.status : "draft" };
}
function cleanPromo(b: any) {
  const headline = String(b.headline || "").trim(); if (headline.length < 2 || headline.length > 120) throw new Error("Enter a headline (2 to 120 characters).");
  const pct = Math.round(Number(b.discountPercent) || 0); if (pct < 0 || pct > 90) throw new Error("The discount must be between 0 and 90 percent.");
  const date = (x: any) => { if (!x) return null; const d = new Date(x); if (isNaN(+d)) throw new Error("One of the dates is not valid."); return d.toISOString(); };
  const starts = date(b.startsAt), ends = date(b.endsAt); if (starts && ends && Date.parse(ends) < Date.parse(starts)) throw new Error("The end date must be after the start date.");
  return { headline, body: String(b.body || "").trim().slice(0, 300), cta_label: String(b.ctaLabel || "").trim().slice(0, 40), cta_href: url(b.ctaHref), image_url: url(b.imageUrl), placement: ["bar", "banner", "popup"].includes(b.placement) ? b.placement : "banner", discount_percent: pct, starts_at: starts, ends_at: ends, active: !!b.active };
}
async function uniqueSlug(db: ReturnType<typeof svc>, name: string) {
  const base = slugify(name) || "product";
  const { data } = await db.from("products").select("slug").like("slug", base + "%");
  const taken = new Set((data || []).map((x: any) => x.slug)); let s = base, n = 2;
  while (taken.has(s)) s = `${base}-${n++}`; return s;
}
function cleanSlide(b: any) {
  const kind = b.kind === "video" ? "video" : "image", image = url(b.imageUrl), video = url(b.videoUrl);
  if (kind === "image" && !image) throw new Error("Add the phone image for this slide.");
  if (kind === "video" && !video) throw new Error("Choose a video for this slide.");
  const date = (x: any) => { if (!x) return null; const d = new Date(x); if (isNaN(+d)) throw new Error("One of the dates is not valid."); return d.toISOString(); };
  const starts = date(b.startsAt), ends = date(b.endsAt); if (starts && ends && Date.parse(ends) < Date.parse(starts)) throw new Error("The end date must be after the start date.");
  return { title: String(b.title || "").trim().slice(0, 80), kind, image_url: image, image_wide_url: url(b.imageWideUrl), video_url: video, poster_url: url(b.posterUrl), href: url(b.href), active: b.active !== false, starts_at: starts, ends_at: ends };
}
const storagePath = (u: string) => { const i = u.indexOf("/media/"); return i >= 0 ? u.slice(i + 7) : ""; };

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
    return json({ pendingReviews: rv.count || 0, ordersToCheck: od.count || 0, outOfStock: (pr.data || []).filter((p: any) => !p.variants.some((v: any) => v.available)).length, emailConfigured: emailConfigured() });
  }
  if (r === "products") { const { data } = await db.from("products").select("*").order("updated_at", { ascending: false }); return json({ items: (data || []).map(rowToProduct) }); }
  if (r === "orders") { const { data } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(300); return json({ items: (data || []).map(rowToOrder) }); }
  if (r === "reviews") { const { data } = await db.from("reviews").select("*").order("created_at", { ascending: false }); return json({ items: (data || []).map(rowToReview) }); }
  if (r === "zones") {
    const [z, a] = await Promise.all([db.from("delivery_zones").select("*").order("sort"), db.from("delivery_areas").select("*").order("sort")]);
    const areas = (a.data || []).map(rowToArea);
    return json({ items: (z.data || []).map((x: any) => ({ id: x.id, name: x.name, fee: Number(x.fee), enabled: x.enabled, sort: x.sort, areas: areas.filter((k) => k.zoneId === x.id) })) });
  }
  if (r === "banks") { const { data } = await db.from("banks").select("*"); return json({ items: data || [] }); }
  if (r === "settings") { const { data } = await db.from("settings").select("value").eq("key", "orders").maybeSingle(); return json({ value: data?.value || { paused: false, message: "" } }); }
  if (r === "shelves") { const { data } = await db.from("shelves").select("*"); return json({ items: data || [] }); }
  if (r === "covers") { const { data } = await db.from("covers").select("*"); return json({ items: data || [] }); }
  if (r === "promotions") { const { data, error } = await db.from("promotions").select("*").order("created_at", { ascending: false }); if (error) return json({ error: "Promotions are not set up yet. Run the 002_improvements.sql file in Supabase." }, 500); return json({ items: (data || []).map(rowToPromo) }); }
  if (r === "hero-videos") { const { data, error } = await db.from("hero_videos").select("*").order("created_at", { ascending: false }); if (error) return json({ error: "Homepage videos are not set up yet. Run the 002_improvements.sql file in Supabase." }, 500); return json({ items: (data || []).map(rowToVideo) }); }
  if (r === "hero-slides") { const { data, error } = await db.from("hero_slides").select("*").order("sort"); if (error) return json({ error: "Run the 003_redesign.sql file in Supabase first." }, 500); return json({ items: (data || []).map(rowToSlide) }); }
  if (r === "page-headers") { const { data, error } = await db.from("page_headers").select("*"); if (error) return json({ error: "Run the 003_redesign.sql file in Supabase first." }, 500); return json({ items: data || [] }); }
  if (r === "announcements") { const { data, error } = await db.from("announcements").select("*").order("sort"); if (error) return json({ error: "Run the 003_redesign.sql file in Supabase first." }, 500); return json({ items: data || [] }); }
  if (r === "export") {
    const [p, o, rv, z, b, pr] = await Promise.all([db.from("products").select("*"), db.from("orders").select("*"), db.from("reviews").select("*"), db.from("delivery_zones").select("*"), db.from("banks").select("*"), db.from("promotions").select("*")]);
    return json({ exportedAt: new Date().toISOString(), products: p.data, orders: o.data, reviews: rv.data, delivery_zones: z.data, banks: b.data, promotions: pr.data });
  }
  return json({ error: "Unknown" }, 404);
}

export async function POST(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const db = svc(), r = params.resource, b = await req.json().catch(() => ({}));
  try {
    if (r === "upload") { if (!["products", "covers", "promos", "videos", "slides", "headers"].includes(b.folder)) throw new Error("Invalid folder."); return json({ url: await uploadDataUrl(String(b.dataUrl), b.folder) }); }
    if (r === "video-upload-url") {
      const ext = b.ext === "webm" ? "webm" : "mp4", path = `videos/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await db.storage.from("media").createSignedUploadUrl(path);
      if (error || !data) throw new Error("Could not start the upload."); return json({ path, token: data.token });
    }
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
    if (r === "promotions") {
      const row = cleanPromo(b);
      if (b.id && UUID.test(b.id)) { const { error } = await db.from("promotions").update(row).eq("id", b.id); if (error) throw new Error("Could not save the promotion."); return json({ id: b.id }); }
      const { data, error } = await db.from("promotions").insert(row).select("id").single(); if (error) throw new Error("Could not save the promotion."); return json({ id: data.id });
    }
    if (r === "hero-videos") {
      const path = String(b.path || ""); if (!/^videos\/[0-9a-f-]{36}\.(mp4|webm)$/.test(path)) throw new Error("Invalid video.");
      const title = String(b.title || "").trim().slice(0, 80) || "Homepage video";
      const { error } = await db.from("hero_videos").insert({ title, video_url: db.storage.from("media").getPublicUrl(path).data.publicUrl, poster_url: url(b.posterUrl), active: false });
      if (error) throw new Error("Could not save the video."); return json({ ok: true });
    }
    if (r === "hero-slides") {
      const row = cleanSlide(b);
      if (b.id && UUID.test(b.id)) { const { error } = await db.from("hero_slides").update(row).eq("id", b.id); if (error) throw new Error("Could not save the slide."); return json({ id: b.id }); }
      const { data: last } = await db.from("hero_slides").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await db.from("hero_slides").insert({ ...row, sort: (last?.sort ?? -1) + 1 }).select("id").single(); if (error) throw new Error("Could not save the slide."); return json({ id: data.id });
    }
    if (r === "hero-videos-publish") {
      await db.from("hero_videos").update({ active: false }).eq("active", true);
      if (b.id) { if (!UUID.test(b.id)) throw new Error("Invalid video."); const { error } = await db.from("hero_videos").update({ active: true }).eq("id", b.id); if (error) throw new Error("Could not publish the video."); }
      return json({ ok: true });
    }
  } catch (e) { return json({ error: (e as Error).message }, 400); }
  return json({ error: "Unknown" }, 404);
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const db = svc(), r = params.resource, b = await req.json().catch(() => ({}));
  try {
    if (r === "zones") {
      const list = (Array.isArray(b.items) ? b.items : []).slice(0, 50);
      if (list.some((x: any) => !String(x.name || "").trim())) throw new Error("Every location needs a name.");
      const { data: have } = await db.from("delivery_zones").select("id"); const keep = new Set(list.filter((x: any) => UUID.test(x.id || "")).map((x: any) => x.id));
      const gone = (have || []).map((x: any) => x.id).filter((id: string) => !keep.has(id)); if (gone.length) await db.from("delivery_zones").delete().in("id", gone);
      for (const [i, x] of list.entries()) {
        const row = { name: String(x.name).trim().slice(0, 60), fee: Math.max(0, Math.round(Number(x.fee) || 0)), enabled: !!x.enabled, sort: i };
        let zid = x.id;
        if (UUID.test(zid || "")) { const { error } = await db.from("delivery_zones").update(row).eq("id", zid); if (error) throw new Error("Could not save."); }
        else { const { data, error } = await db.from("delivery_zones").insert(row).select("id").single(); if (error || !data) throw new Error("Could not save."); zid = data.id; }
        const areas = (Array.isArray(x.areas) ? x.areas : []).slice(0, 100);
        const { data: ha } = await db.from("delivery_areas").select("id").eq("zone_id", zid); const ka = new Set(areas.filter((a: any) => UUID.test(a.id || "")).map((a: any) => a.id));
        const ga = (ha || []).map((a: any) => a.id).filter((id: string) => !ka.has(id)); if (ga.length) await db.from("delivery_areas").delete().in("id", ga);
        for (const [j, a] of areas.entries()) {
          const ar = { zone_id: zid, name: String(a.name || "").trim().slice(0, 60), fee: a.fee === null || a.fee === "" || a.fee === undefined ? null : Math.max(0, Math.round(Number(a.fee) || 0)), enabled: a.enabled !== false, sort: j };
          if (!ar.name) throw new Error(`Every area under ${row.name} needs a name.`);
          const { error } = UUID.test(a.id || "") ? await db.from("delivery_areas").update(ar).eq("id", a.id) : await db.from("delivery_areas").insert(ar);
          if (error) throw new Error("Could not save the areas. Make sure the 002_improvements.sql file was run in Supabase.");
        }
      }
      return json({ ok: true });
    }
    if (r === "banks") {
      const list = (Array.isArray(b.items) ? b.items : []).slice(0, 20);
      const rows = list.map((x: any) => ({ ...(UUID.test(x.id || "") ? { id: x.id } : {}), bank: String(x.bank || "").trim().slice(0, 60), name: String(x.name || "").trim().slice(0, 80), number: String(x.number || "").replace(/\D/g, "").slice(0, 20), active: !!x.active }));
      if (rows.some((x: any) => !x.bank || !x.name || x.number.length < 10)) throw new Error("Every bank needs a name, an account name and a 10 digit account number.");
      const { data: have } = await db.from("banks").select("id"); const keep = new Set(rows.filter((x: any) => x.id).map((x: any) => x.id));
      const gone = (have || []).map((x: any) => x.id).filter((id: string) => !keep.has(id)); if (gone.length) await db.from("banks").delete().in("id", gone);
      const withId = rows.filter((x: any) => x.id), noId = rows.filter((x: any) => !x.id);
      if (withId.length) { const { error } = await db.from("banks").upsert(withId); if (error) throw new Error("Could not save."); }
      if (noId.length) { const { error } = await db.from("banks").insert(noId); if (error) throw new Error("Could not save."); }
      return json({ ok: true });
    }
    if (r === "settings") { await db.from("settings").upsert({ key: "orders", value: { paused: !!b.paused, message: String(b.message || "").slice(0, 200) } }); return json({ ok: true }); }
    if (r === "hero-slides-order") { for (const [i, id] of (Array.isArray(b.ids) ? b.ids : []).entries()) if (UUID.test(id)) await db.from("hero_slides").update({ sort: i }).eq("id", id); return json({ ok: true }); }
    if (r === "reviews-order") { for (const [i, id] of (Array.isArray(b.ids) ? b.ids : []).slice(0, 300).entries()) if (UUID.test(id)) await db.from("reviews").update({ sort_order: (i + 1) * 10 }).eq("id", id); return json({ ok: true }); }
    if (r === "page-headers") { await db.from("page_headers").upsert({ page: String(b.page).slice(0, 40), image_url: url(b.imageUrl) }); return json({ ok: true }); }
    if (r === "announcements") {
      const list = (Array.isArray(b.items) ? b.items : []).slice(0, 8).map((x: any, i: number) => ({ ...(UUID.test(x.id || "") ? { id: x.id } : {}), text: String(x.text || "").trim().slice(0, 120), href: url(x.href), active: x.active !== false, sort: i }));
      if (list.some((x: any) => !x.text)) throw new Error("Every announcement needs some text.");
      const { data: have } = await db.from("announcements").select("id"); const keep = new Set(list.filter((x: any) => x.id).map((x: any) => x.id));
      const gone = (have || []).map((x: any) => x.id).filter((id: string) => !keep.has(id)); if (gone.length) await db.from("announcements").delete().in("id", gone);
      const withId = list.filter((x: any) => x.id), noId = list.filter((x: any) => !x.id);
      if (withId.length) { const { error } = await db.from("announcements").upsert(withId); if (error) throw new Error("Could not save."); }
      if (noId.length) { const { error } = await db.from("announcements").insert(noId); if (error) throw new Error("Could not save."); }
      return json({ ok: true });
    }
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
    const { data: before } = await db.from("orders").select("status").eq("id", b.id).maybeSingle();
    const p: any = {};
    if (["awaiting_payment", "paid", "dispatched", "delivered", "cancelled"].includes(b.status)) p.status = b.status;
    if (b.deliveryFee === null || Number.isFinite(Number(b.deliveryFee))) p.delivery_fee = b.deliveryFee === null ? null : Math.max(0, Math.round(Number(b.deliveryFee)));
    if (typeof b.seen === "boolean") p.seen = b.seen;
    const { data: after } = await db.from("orders").update(p).eq("id", b.id).select("*").single();
    if (after && p.status && before && p.status !== before.status && ["paid", "dispatched", "delivered", "cancelled"].includes(p.status)) await notify(db, rowToOrder(after), `status_${p.status}`, "customer");
    return json({ ok: true });
  }
  if (r === "reviews") {
    const p: any = {};
    if (["pending", "visible", "hidden"].includes(b.status)) p.status = b.status;
    if (typeof b.reply === "string") p.reply = b.reply.slice(0, 800);
    if (b.unpin === true) p.sort_order = null;
    await db.from("reviews").update(p).eq("id", b.id); return json({ ok: true });
  }
  if (r === "reviews-seen") { await db.from("reviews").update({ seen: true }).eq("seen", false); return json({ ok: true }); }
  if (r === "orders-seen") { await db.from("orders").update({ seen: true }).eq("seen", false).neq("paid_claimed", true); return json({ ok: true }); }
  return json({ error: "Unknown" }, 404);
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return deny();
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return json({ error: "Invalid" }, 400);
  const db = svc();
  if (params.resource === "products") { await db.from("products").delete().eq("id", id); return json({ ok: true }); }
  if (params.resource === "reviews") { await db.from("reviews").delete().eq("id", id); return json({ ok: true }); }
  if (params.resource === "promotions") { await db.from("promotions").delete().eq("id", id); return json({ ok: true }); }
  if (params.resource === "hero-slides") { await db.from("hero_slides").delete().eq("id", id); return json({ ok: true }); }
  if (params.resource === "hero-videos") {
    const { data } = await db.from("hero_videos").select("video_url, poster_url").eq("id", id).maybeSingle();
    const paths = [data?.video_url, data?.poster_url].map((u) => storagePath(u || "")).filter(Boolean);
    if (paths.length) await db.storage.from("media").remove(paths);
    await db.from("hero_videos").delete().eq("id", id); return json({ ok: true });
  }
  return json({ error: "Unknown" }, 404);
}
