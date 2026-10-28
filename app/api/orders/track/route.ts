import { json, limited, svc } from "@/lib/server";
export async function POST(req: Request) {
  if (limited(req, "track", 15, 3_600_000)) return json({ error: "Too many attempts. Try again later." }, 429);
  const b = await req.json().catch(() => ({}));
  const number = String(b.number || "").trim().toUpperCase(), ph = String(b.phone || "").replace(/\D/g, "").slice(-9);
  if (!number || ph.length < 9) return json({ error: "Enter your order number and phone number." }, 400);
  const { data } = await svc().from("orders").select("id, phone").eq("number", number).maybeSingle();
  if (!data || data.phone.replace(/\D/g, "").slice(-9) !== ph) return json({ error: "We could not find an order with that number and phone." }, 404);
  return json({ id: data.id });
}
