import type { MetadataRoute } from "next";
import { anonServer } from "@/lib/server";
import { SITE } from "@/lib/util";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/shop", "/worth-discovering", "/combo", "/info/about", "/info/contact", "/info/delivery", "/info/reviews", "/info/privacy"].map((p) => ({ url: SITE + p }));
  try { const { data } = await anonServer().from("products").select("slug, updated_at").eq("status", "active"); return [...pages, ...(data || []).map((p) => ({ url: `${SITE}/products/${p.slug}`, lastModified: p.updated_at }))]; } catch { return pages; }
}
