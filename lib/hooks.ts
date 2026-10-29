"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CartLine } from "./types";
// Device-only storage for cart, favourites and a convenience list of recent order references.
export function useLocal<T>(key: string, initial: T) {
  const init = useRef(initial);
  const [val, setVal] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => { try { const r = localStorage.getItem(key); setVal(r ? (JSON.parse(r) as T) : init.current); } catch { setVal(init.current); } };
    read(); setReady(true);
    const h = (e: Event) => { if ((e as CustomEvent).detail === key) read(); };
    window.addEventListener("sbb", h); window.addEventListener("storage", read);
    return () => { window.removeEventListener("sbb", h); window.removeEventListener("storage", read); };
  }, [key]);
  const set = useCallback((v: T | ((p: T) => T)) => {
    try {
      const r = localStorage.getItem(key); const cur = r ? (JSON.parse(r) as T) : init.current;
      const next = typeof v === "function" ? (v as (p: T) => T)(cur) : v;
      localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new CustomEvent("sbb", { detail: key })); return true;
    } catch { return false; }
  }, [key]);
  return [val, set, ready] as const;
}
export const useCart = () => useLocal<CartLine[]>("sbb_cart_v3", []);
export const useFavs = () => useLocal<string[]>("sbb_favs_v3", []);
export const useRecent = () => useLocal<{ id: string; number: string; at: number }[]>("sbb_recent_orders_v1", []);
