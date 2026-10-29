"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { configured, sb } from "./supabase";
import { Area, HeroVideo, Product, Promotion, Review, Zone, promoLive, rowToArea, rowToProduct, rowToPromo, rowToReview, rowToVideo } from "./types";

export type StoreState = { ready: boolean; error: string; products: Product[]; reviews: Review[]; covers: Record<string, string[]>; shelves: Record<string, string[]>; zones: Zone[]; promos: Promotion[]; video: HeroVideo | null; orders: { paused: boolean; message: string }; refresh: () => void };
const empty: StoreState = { ready: false, error: "", products: [], reviews: [], covers: {}, shelves: {}, zones: [], promos: [], video: null, orders: { paused: false, message: "" }, refresh: () => {} };
const Ctx = createContext<StoreState>(empty);
export const useStore = () => useContext(Ctx);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const soft = async (q: PromiseLike<{ data: any; error: any }>) => { const r = await q; return r.error ? { data: [] as any[] } : r; };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<StoreState>(empty);
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!configured) { setS((o) => ({ ...o, ready: true, error: "setup" })); return; }
    try {
      const c = sb();
      const [p, r, cv, sh, st, z, ar, pr, vd] = await Promise.all([
        c.from("products").select("*").eq("status", "active"),
        c.from("reviews").select("*").eq("status", "visible").order("created_at", { ascending: false }),
        c.from("covers").select("*"), c.from("shelves").select("*"),
        c.from("settings").select("*").eq("key", "orders"),
        c.from("delivery_zones").select("*").eq("enabled", true).order("sort"),
        soft(c.from("delivery_areas").select("*").eq("enabled", true).order("sort")),
        soft(c.from("promotions").select("*")), soft(c.from("hero_videos").select("*").eq("active", true)),
      ]);
      const bad = [p, r, cv, sh, st, z].find((x) => x.error);
      if (bad?.error) throw bad.error;
      if (!alive.current) return;
      const areas: Area[] = (ar.data || []).map(rowToArea);
      setS((o) => ({
        ...o, ready: true, error: "", products: (p.data || []).map(rowToProduct), reviews: (r.data || []).map(rowToReview),
        covers: Object.fromEntries((cv.data || []).map((x: { category: string; images: string[] }) => [x.category, x.images])),
        shelves: Object.fromEntries((sh.data || []).map((x: { key: string; ids: string[] }) => [x.key, x.ids])),
        zones: (z.data || []).map((x: { id: string; name: string; fee: number; enabled: boolean; sort: number }) => ({ ...x, fee: Number(x.fee), areas: areas.filter((a) => a.zoneId === x.id) })),
        promos: (pr.data || []).map(rowToPromo).filter((x: Promotion) => promoLive(x)),
        video: vd.data?.[0] ? rowToVideo(vd.data[0]) : null,
        orders: (st.data?.[0]?.value as { paused: boolean; message: string }) || { paused: false, message: "" },
      }));
    } catch { if (alive.current) setS((o) => ({ ...o, ready: true, error: "load" })); }
  }, []);
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]);
  return <Ctx.Provider value={{ ...s, refresh: load }}>{children}</Ctx.Provider>;
}
