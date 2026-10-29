import { json, limited, notify, svc } from "@/lib/server";
import { rowToOrder } from "@/lib/types";
const UUID = /^[0-9a-f-]{36}$/i;
// Records a payment REPORT only. It never marks the order as paid.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return json({ error: "Not found" }, 404);
  if (limited(req, "claim", 20, 3_600_000)) return json({ error: "Too many attempts. Please try again later." }, 429);
  const db = svc();
  const { data } = await db.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!data) return json({ error: "Order not found." }, 404);
  if (data.status !== "awaiting_payment") return json({ ok: true, status: data.status });
  if (!data.paid_claimed) {
    const { data: up, error } = await db.from("orders").update({ paid_claimed: true, paid_reported_at: new Date().toISOString(), seen: false }).eq("id", params.id).select("*").single();
    if (error || !up) return json({ error: "We could not record your payment notification. Please try again." }, 500);
    const o = rowToOrder(up);
    await Promise.allSettled([notify(db, o, "paid_reported", "admin"), notify(db, o, "paid_reported", "customer")]);
  }
  return json({ ok: true, status: "awaiting_payment", reported: true });
}
