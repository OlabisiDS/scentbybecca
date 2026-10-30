/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/AdminShell";
import { ReviewCard } from "@/components/Reviews";
import { sortReviews, type Review } from "@/lib/types";

export default function Reviews() {
  const { api, refresh } = useAdmin();
  const [items, setItems] = useState<Review[] | null>(null), [fresh, setFresh] = useState<string[]>([]), [drafts, setDrafts] = useState<Record<string, string>>({}), [prods, setProds] = useState<Record<string, string>>({}), [msg, setMsg] = useState("");
  const load = useCallback(() => api("reviews").then((j) => setItems(j.items)).catch((e) => setMsg(e.message)), [api]);
  useEffect(() => {
    api("reviews").then((j) => { setItems(j.items); setFresh(j.items.filter((r: Review) => !r.seen).map((r: Review) => r.id)); api("reviews-seen", { method: "PATCH", body: {} }).then(refresh).catch(() => {}); }).catch((e) => setMsg(e.message));
    api("products").then((j) => setProds(Object.fromEntries(j.items.map((p: any) => [p.id, p.name])))).catch(() => {});
  }, [api, refresh]);
  const patch = async (id: string, body: object, m: string) => { try { await api("reviews", { method: "PATCH", body: { id, ...body } }); setMsg(m); setTimeout(() => setMsg(""), 2500); load(); refresh(); } catch (e) { setMsg((e as Error).message); } };
  const shown = sortReviews((items || []).filter((x) => x.target === "store" && x.status === "visible"));
  const move = async (i: number, d: number) => {
    const ids = shown.map((x) => x.id), j = i + d; if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try { await api("reviews-order", { method: "PUT", body: { ids } }); setMsg("Order saved."); setTimeout(() => setMsg(""), 2000); load(); } catch (e) { setMsg((e as Error).message); }
  };
  const sorted = [...(items || [])].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending") || b.createdAt - a.createdAt);
  return (
    <>
      <h1>Reviews</h1>
      <p className="muted small">New reviews wait here until you approve them. Only approved reviews show on the store.</p>
      {msg && <div className="fb" role="status">{msg}</div>}
      {shown.length > 1 && (
        <div className="cardx">
          <b>Display order on the store</b>
          <p className="muted small" style={{ margin: "4px 0 8px" }}>Reviews you place here stay at the top in this order. New approved reviews appear below them until you move them up.</p>
          {shown.map((x, i) => (
            <div key={x.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "6px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <div><b>{i + 1}. {x.name}</b> {x.sortOrder === null && <span className="tag">New, not pinned</span>}<div className="small muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60vw" }}>{x.text}</div></div>
              <div className="acts" style={{ margin: 0 }}>
                <button className="btn o sm fit" aria-label={`Move ${x.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>Up</button>
                <button className="btn o sm fit" aria-label={`Move ${x.name} down`} disabled={i === shown.length - 1} onClick={() => move(i, 1)}>Down</button>
                {x.sortOrder !== null && <button className="btn o sm fit" onClick={async () => { await api("reviews", { method: "PATCH", body: { id: x.id, unpin: true } }); load(); }}>Unpin</button>}
              </div>
            </div>))}
        </div>)}
      {items === null ? <p className="muted">Loading...</p> : sorted.length === 0 ? <p>No reviews yet.</p> : sorted.map((r) => (
        <div key={r.id} style={{ marginBottom: 18 }}>
          <div className="acts" style={{ margin: "0 0 6px" }}>
            {fresh.includes(r.id) && <span className="tag g">New</span>}
            <span className={"tag " + (r.status === "visible" ? "g" : r.status === "pending" ? "" : "r")}>{r.status === "visible" ? "Showing on store" : r.status === "pending" ? "Waiting for approval" : "Hidden"}</span>
            <span className="tag">{r.target === "store" ? "About the store" : "On: " + (prods[r.target] ?? "a product")}</span>
          </div>
          <ReviewCard r={{ ...r, reply: "" }} />
          {r.reply && <p className="small"><b>Your reply:</b> {r.reply}</p>}
          <label className="lab" htmlFor={"rp" + r.id}>Reply to this review</label>
          <textarea id={"rp" + r.id} value={drafts[r.id] ?? r.reply} onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} style={{ minHeight: 80 }} />
          <div className="acts">
            {r.status !== "visible" && <button className="btn sm fit" onClick={() => patch(r.id, { status: "visible" }, "Review approved. It is now showing on the store.")}>Approve</button>}
            <button className="btn o sm fit" onClick={() => patch(r.id, { reply: (drafts[r.id] ?? r.reply).trim() }, "Reply saved. It shows under the review.")}>Save reply</button>
            {r.status === "visible" && <button className="btn o sm fit" onClick={() => patch(r.id, { status: "hidden" }, "Review hidden.")}>Hide review</button>}
            <button className="btn red sm fit" onClick={async () => { if (confirm("Permanently delete this review? To keep it for later, use Hide review instead.")) { await api("reviews", { method: "DELETE", query: `id=${r.id}` }); load(); refresh(); } }}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}
