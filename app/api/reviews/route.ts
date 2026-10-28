import { json, limited, svc, uploadDataUrl } from "@/lib/server";
const UUID = /^[0-9a-f-]{36}$/i;
export async function POST(req: Request) {
  if (limited(req, "rev", 5, 3_600_000)) return json({ error: "Too many reviews from this connection. Please try again later." }, 429);
  const b = await req.json().catch(() => null);
  if (!b) return json({ error: "Invalid request." }, 400);
  if (b.website) return json({ ok: true });
  const name = String(b.name || "").trim(), text = String(b.text || "").trim(), rating = Math.round(Number(b.rating)), target = String(b.target || "store");
  if (name.length < 2 || name.length > 60) return json({ error: "Please enter your name." }, 400);
  if (!(rating >= 1 && rating <= 5)) return json({ error: "Please choose a star rating." }, 400);
  if (text.length < 10 || text.length > 1500) return json({ error: "Please write a little more about your experience." }, 400);
  if (target !== "store" && !UUID.test(target)) return json({ error: "Invalid request." }, 400);
  try {
    const images: string[] = [];
    for (const d of (Array.isArray(b.images) ? b.images : []).slice(0, 3)) images.push(await uploadDataUrl(String(d), "reviews"));
    const { error } = await svc().from("reviews").insert({ target, name, rating, text, images, status: "pending" });
    if (error) throw new Error("Could not save your review.");
    return json({ ok: true });
  } catch (e) { return json({ error: (e as Error).message }, 400); }
}
