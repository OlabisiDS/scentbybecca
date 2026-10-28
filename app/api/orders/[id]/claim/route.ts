import { json, limited, svc } from "@/lib/server";
const UUID = /^[0-9a-f-]{36}$/i;
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id) || limited(req, "claim", 20, 3_600_000)) return json({ error: "Not allowed" }, 400);
  await svc().from("orders").update({ paid_claimed: true }).eq("id", params.id).eq("status", "awaiting_payment");
  return json({ ok: true });
}
