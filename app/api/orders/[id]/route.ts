import { json, svc } from "@/lib/server";
import { rowToOrder } from "@/lib/types";
const UUID = /^[0-9a-f-]{36}$/i;
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return json({ error: "Not found" }, 404);
  const db = svc();
  const { data } = await db.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!data) return json({ error: "Not found" }, 404);
  const { data: banks } = await db.from("banks").select("id, bank, name, number").eq("active", true);
  return json({ order: rowToOrder(data), banks: banks || [] });
}
