import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
