"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { configured, sb } from "./supabase";
import { Product, Review, Zone, rowToProduct, rowToReview } from "./types";

export type StoreState = { ready: boolean; error: string; products: Product[]; reviews: Review[]; covers: Record<string, string[]>; shelves: Record<string, string[]>; zones: Zone[]; orders: { paused: boolean; message: string }; refresh: () => void };
const empty: StoreState = { ready: false, error: "", products: [], reviews: [], covers: {}, shelves: {}, zones: [], orders: { paused: false, message: "" }, refresh: () => {} };
const Ctx = createContext<StoreState>(empty);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<StoreState>(empty);
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!configured) { setS((o) => ({ ...o, ready: true, error: "setup" })); return; }
    try {
      const c = sb();
      const [p, r, cv, sh, st, z] = await Promise.all([
        c.from("products").select("*").eq("status", "active"),
        c.from("reviews").select("*").eq("status", "visible").order("created_at", { ascending: false }),
        c.from("covers").select("*"), c.from("shelves").select("*"),
        c.from("settings").select("*").eq("key", "orders"),
        c.from("delivery_zones").select("*").eq("enabled", true).order("sort"),
      ]);
      const bad = [p, r, cv, sh, st, z].find((x) => x.error);
      if (bad?.error) throw bad.error;
      if (!alive.current) return;
      setS((o) => ({
        ...o, ready: true, error: "", products: (p.data || []).map(rowToProduct), reviews: (r.data || []).map(rowToReview),
        covers: Object.fromEntries((cv.data || []).map((x: { category: string; images: string[] }) => [x.category, x.images])),
        shelves: Object.fromEntries((sh.data || []).map((x: { key: string; ids: string[] }) => [x.key, x.ids])),
        zones: (z.data || []).map((x: { id: string; name: string; fee: number; enabled: boolean; sort: number }) => ({ ...x, fee: Number(x.fee) })),
        orders: (st.data?.[0]?.value as { paused: boolean; message: string }) || { paused: false, message: "" },
      }));
    } catch { if (alive.current) setS((o) => ({ ...o, ready: true, error: "load" })); }
  }, []);
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]);
  return <Ctx.Provider value={{ ...s, refresh: load }}>{children}</Ctx.Provider>;
}
