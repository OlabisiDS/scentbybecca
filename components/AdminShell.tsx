/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Truck, Landmark, LayoutDashboard, ListOrdered, LogOut, MessageSquare, MoreHorizontal, Package, Receipt, Images, Wrench, ExternalLink, Megaphone, Film, GalleryHorizontal, PanelTop, Bell, type LucideIcon } from "lucide-react";
import PasswordField from "./PasswordField";
import Sheet from "./Sheet";
import { LOGO } from "@/lib/config";
import { configured, sb } from "@/lib/supabase";

type Opt = { method?: string; body?: unknown; query?: string };
type Summary = { pendingReviews: number; ordersToCheck: number; outOfStock: number; emailConfigured?: boolean };
const Ctx = createContext<{ api: (r: string, o?: Opt) => Promise<any>; summary: Summary; refresh: () => void }>({ api: async () => ({}), summary: { pendingReviews: 0, ordersToCheck: 0, outOfStock: 0 }, refresh: () => {} });
export const useAdmin = () => useContext(Ctx);
const NAV: { href: string; label: string; I: LucideIcon; badge?: "ordersToCheck" | "pendingReviews" }[] = [
  { href: "/admin", label: "Home", I: LayoutDashboard }, { href: "/admin/products", label: "Products", I: Package }, { href: "/admin/orders", label: "Orders", I: Receipt, badge: "ordersToCheck" },
  { href: "/admin/reviews", label: "Reviews", I: MessageSquare, badge: "pendingReviews" }, { href: "/admin/slides", label: "Hero slides", I: GalleryHorizontal }, { href: "/admin/headers", label: "Page headers", I: PanelTop }, { href: "/admin/announcements", label: "Announcements", I: Bell }, { href: "/admin/promotions", label: "Promotions", I: Megaphone }, { href: "/admin/video", label: "Video library", I: Film }, { href: "/admin/shelves", label: "Shelf order", I: ListOrdered }, { href: "/admin/covers", label: "Category covers", I: Images },
  { href: "/admin/delivery", label: "Delivery and orders", I: Truck }, { href: "/admin/banks", label: "Bank accounts", I: Landmark }, { href: "/admin/tools", label: "Import and backup", I: Wrench },
];
async function call(r: string, o: Opt = {}) {
  const { data } = await sb().auth.getSession();
  const res = await fetch(`/api/admin/${r}${o.query ? `?${o.query}` : ""}`, { method: o.method || "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` }, body: o.body ? JSON.stringify(o.body) : undefined });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [st, setSt] = useState<"load" | "setup" | "out" | "in" | "denied">("load");
  const [email, setEmail] = useState(""), [pw, setPw] = useState(""), [mode, setMode] = useState<"login" | "forgot">("login"), [info, setInfo] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [more, setMore] = useState(false);
  const [summary, setSummary] = useState<Summary>({ pendingReviews: 0, ordersToCheck: 0, outOfStock: 0 });
  const check = useCallback(async () => { try { await call("whoami"); setSt("in"); } catch { setSt("denied"); } }, []);
  useEffect(() => { if (!configured) { setSt("setup"); return; } sb().auth.getSession().then(({ data }) => (data.session ? check() : setSt("out"))); }, [check]);
  const refresh = useCallback(() => { call("summary").then(setSummary).catch(() => {}); }, []);
  useEffect(() => { if (st !== "in") return; refresh(); const t = setInterval(refresh, 45000); return () => clearInterval(t); }, [st, refresh]);
  const login = async () => {
    setBusy(true); setErr("");
    const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) {
      const m = error.message.toLowerCase();
      setErr(m.includes("confirm") ? "This account's email has not been confirmed yet." : m.includes("rate") || error.status === 429 ? "Too many attempts. Please wait a few minutes and try again." : "That email or password is not right.");
      setBusy(false); return;
    }
    await check(); setBusy(false);
  };
  const forgot = async () => {
    setBusy(true); setErr(""); setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr("Enter the email address of your admin account."); setBusy(false); return; }
    // The same message is shown whether or not the address has an account.
    await sb().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` }).catch(() => {});
    setInfo("If an admin account exists for that email, a reset link has been sent. Check your inbox and spam folder. The link opens a page where you choose a new password."); setBusy(false);
  };
  const out = async () => { await sb().auth.signOut(); setSt("out"); };
  if (st === "load") return null;
  if (st === "setup") return <div className="login"><h1 style={{ fontSize: 22 }}>Admin not set up</h1><p>Add your Supabase details to <b>.env.local</b> and restart. The README explains how.</p></div>;
  if (st === "out" || st === "denied") return (
    <div className="login">
      <img src={LOGO} alt="ScentbyBecca" style={{ height: 56, width: "auto", marginBottom: 12 }} />
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>{mode === "login" ? "Admin sign in" : "Reset your password"}</h1>
      {st === "denied" && mode === "login" && <p className="err" role="alert">This account is not allowed to use the admin area.</p>}
      <label className="lab" htmlFor="em">Email</label><input id="em" className="in-t" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode === "login" ? <PasswordField id="pw" label="Password" value={pw} onChange={setPw} autoComplete="current-password" onEnter={login} /> : null}
      {err && <p className="err" role="alert">{err}</p>}
      {info && <p className="fb" role="status">{info}</p>}
      {mode === "login" ? <>
        <button className="btn" style={{ marginTop: 16 }} onClick={login} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <p style={{ marginTop: 14 }}><button type="button" className="linkbtn" onClick={() => { setMode("forgot"); setErr(""); setInfo(""); }}>Forgot password?</button></p>
      </> : <>
        <button className="btn" style={{ marginTop: 16 }} onClick={forgot} disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
        <p style={{ marginTop: 14 }}><button type="button" className="linkbtn" onClick={() => { setMode("login"); setErr(""); setInfo(""); }}>Back to sign in</button></p>
      </>}
      <p style={{ marginTop: 8 }}><Link href="/">Back to store</Link></p>
    </div>
  );
  const on = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  const tabs = NAV.slice(0, 4), rest = NAV.slice(4);
  return (
    <Ctx.Provider value={{ api: call, summary, refresh }}>
      <div className="ash">
        <aside className="side" aria-label="Admin menu">
          <img src={LOGO} alt="ScentbyBecca" />
          {NAV.map(({ href, label, I, badge }) => <Link key={href} href={href} className={on(href) ? "on" : ""}><I size={20} strokeWidth={1.5} />{label}{badge && summary[badge] > 0 && <span className="badge">{summary[badge]}</span>}</Link>)}
          <div style={{ marginTop: "auto" }}><Link href="/" target="_blank"><ExternalLink size={20} strokeWidth={1.5} />View store</Link><button onClick={out}><LogOut size={20} strokeWidth={1.5} />Sign out</button></div>
        </aside>
        <div>
          <div className="atop"><img src={LOGO} alt="ScentbyBecca" /><span style={{ fontSize: 14 }}>Admin</span></div>
          <div className="abody">{children}</div>
        </div>
        <nav className="tabbar" aria-label="Admin tabs">
          {tabs.map(({ href, label, I, badge }) => <Link key={href} href={href} className={on(href) ? "on" : ""}><I size={22} strokeWidth={1.5} />{label}{badge && summary[badge] > 0 && <span className="badge">{summary[badge]}</span>}</Link>)}
          <button onClick={() => setMore(true)} className={rest.some((r) => on(r.href)) ? "on" : ""}><MoreHorizontal size={22} strokeWidth={1.5} />More</button>
        </nav>
        {more && <Sheet title="More" onClose={() => setMore(false)}><div className="sheetlist">
          {rest.map(({ href, label, I }) => <Link key={href} href={href} onClick={() => setMore(false)}><I size={22} strokeWidth={1.5} />{label}</Link>)}
          <Link href="/" target="_blank" onClick={() => setMore(false)}><ExternalLink size={22} strokeWidth={1.5} />View store</Link>
          <a href="#" onClick={(e) => { e.preventDefault(); out(); }}><LogOut size={22} strokeWidth={1.5} />Sign out</a>
        </div></Sheet>}
      </div>
    </Ctx.Provider>
  );
}
