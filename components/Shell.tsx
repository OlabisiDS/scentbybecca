"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Boxes, ChevronDown, ChevronRight, Droplet, Gem, Gift, Heart, Home, Info, Instagram, Menu, Package, Phone, Shuffle, ShoppingBag, Sparkles, SprayCan, Search, Star, Tag, Truck, Wind, X, PackageSearch, type LucideIcon } from "lucide-react";
import AnnouncementBar from "./Announcements";
import MiniCart from "./MiniCart";
import ScrollMemory from "./ScrollMemory";
import SearchOverlay from "./SearchOverlay";
import Setup from "./Setup";
import { PromoBar, PromoPopup } from "./Promos";
import { CATEGORIES, INSTAGRAM_URL, LOGO, TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/config";
import { useCart, useFavs } from "@/lib/hooks";
import { StoreProvider, useStore } from "@/lib/store";

const ICONS: Record<string, LucideIcon> = { "designer-niche": Gem, "affordable-miniature": Tag, "perfume-combos": Boxes, "gift-sets": Gift, "perfume-oils": Droplet, "deodorant-sprays": SprayCan, "diffusers-humidifiers": Wind, "other-items": Package };
export const TikTok = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v11.500a3.500 3.500 0 11-3.500-3.500M14 3c.4 2.800 2.300 4.600 5.500 4.800" /></svg>
);
const WaIcon = ({ s = 28 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.200-4A8 8 0 1112 20a8 8 0 01-3.800-1z" /><path d="M9 9c0 3 3 6 6 6l1-1.500-2-1-1 .8c-1-.5-1.800-1.300-2.300-2.300l.8-1-1-2z" /></svg>
);
function NavProgress() {
  const path = usePathname();
  const [on, setOn] = useState(false);
  useEffect(() => setOn(false), [path]);
  useEffect(() => { if (!on) return; const t = setTimeout(() => setOn(false), 2500); return () => clearTimeout(t); }, [on]);
  useEffect(() => {
    const h = (e: MouseEvent) => { const a = (e.target as HTMLElement).closest("a"); if (!a || a.target || e.metaKey || e.ctrlKey) return; const u = new URL(a.href, location.href); if (u.origin === location.origin && (u.pathname !== location.pathname || u.search !== location.search)) setOn(true); };
    document.addEventListener("click", h); return () => document.removeEventListener("click", h);
  }, []);
  return on ? <div className="nprog" aria-hidden="true" /> : null;
}
function Drawer({ close }: { close: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(""), [q, setQ] = useState("");
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [close]);
  const L = ({ href, icon: I, label }: { href: string; icon: LucideIcon; label: string }) => <Link href={href} onClick={close}><span className="gi"><I size={24} strokeWidth={1.5} /></span>{label}</Link>;
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img src={LOGO} alt="ScentbyBecca" style={{ height: 56, width: "auto" }} />
          <button className="ib" style={{ color: "var(--gold-lt)" }} onClick={close} aria-label="Close menu" autoFocus><X size={24} strokeWidth={1.5} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); close(); router.push("/shop?q=" + encodeURIComponent(q)); }} role="search">
          <label className="sr" htmlFor="ms">Search fragrances</label><input id="ms" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fragrances" />
        </form>
        <nav>
          <L href="/" icon={Home} label="Home" /><L href="/shop" icon={ShoppingBag} label="Shop All" /><L href="/worth-discovering" icon={Sparkles} label="Worth Discovering" /><L href="/favourites" icon={Heart} label="Favourites" /><L href="/combo" icon={Shuffle} label="Curate a Combo" /><L href="/orders" icon={PackageSearch} label="Track your order" />
          {CATEGORIES.map((c) => {
            const I = ICONS[c.slug];
            if (!c.subs) return <L key={c.slug} href={`/shop?cat=${c.slug}`} icon={I} label={c.name} />;
            const o = open === c.slug;
            return (
              <div key={c.slug}>
                <button className="row" aria-expanded={o} onClick={() => setOpen(o ? "" : c.slug)}><span className="gi"><I size={24} strokeWidth={1.5} /></span><span style={{ flex: 1 }}>{c.name}</span><span className="gi">{o ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span></button>
                {o && <div className="subs"><Link href={`/shop?cat=${c.slug}`} onClick={close}>All {c.name}</Link>{c.subs.map((s) => <Link key={s.slug} href={`/shop?cat=${c.slug}&sub=${s.slug}`} onClick={close}>{s.name}</Link>)}</div>}
              </div>
            );
          })}
        </nav>
        <hr />
        <nav><L href="/info/about" icon={Info} label="About Us" /><L href="/info/contact" icon={Phone} label="Contact Us" /><L href="/info/delivery" icon={Truck} label="Delivery & Refund Policy" /><L href="/info/reviews" icon={Star} label="Customer Reviews" /></nav>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="ib" style={{ width: 44, minHeight: 44, color: "var(--gold-lt)" }}><Instagram size={26} strokeWidth={1.5} /></a>
          <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="ib" style={{ width: 44, minHeight: 44, color: "var(--gold-lt)" }}><TikTok size={26} /></a>
        </div>
      </aside>
    </>
  );
}
function Header() {
  const [open, setOpen] = useState(false), [find, setFind] = useState(false);
  const [cart] = useCart(); const [favs] = useFavs();
  const n = cart.reduce((a, l) => a + l.qty, 0);
  return (
    <>
      <header className="hd">
        <button className="ib" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={26} strokeWidth={1.5} /></button>
        <Link href="/" aria-label="ScentbyBecca home"><img src={LOGO} alt="ScentbyBecca, a scent that lingers" width={100} height={44} /></Link>
        <div style={{ display: "flex" }}>
          <button className="ib" aria-label="Search" onClick={() => setFind(true)}><Search size={23} strokeWidth={1.5} /></button>
          <Link className={"ib" + (favs.length ? " full" : "")} href="/favourites" aria-label={`Favourites, ${favs.length} saved`}><Heart size={24} strokeWidth={1.5} fill={favs.length ? "currentColor" : "none"} />{favs.length > 0 && <span className="cnt" key={favs.length}>{favs.length}</span>}</Link>
          <Link className={"ib" + (n ? " full" : "")} href="/cart" aria-label={`Cart, ${n} items`}><ShoppingBag size={24} strokeWidth={1.5} fill={n ? "currentColor" : "none"} />{n > 0 && <span className="cnt" key={n}>{n}</span>}</Link>
        </div>
      </header>
      {open && <Drawer close={() => setOpen(false)} />}
      {find && <SearchOverlay onClose={() => setFind(false)} />}
    </>
  );
}
function Fab() {
  const path = usePathname();
  const [href, setHref] = useState(`https://wa.me/${WHATSAPP_NUMBER}`);
  useEffect(() => {
    const t = path.startsWith("/products") ? `Hello ScentbyBecca, I have a question about this product: ${window.location.href}` : "Hello ScentbyBecca, I have an enquiry.";
    setHref(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t)}`);
  }, [path]);
  return <a className="fab" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><WaIcon /></a>;
}
function Footer() {
  return (
    <footer className="ft2"><div className="wrap">
      <img src={LOGO} alt="ScentbyBecca" />
      <p style={{ margin: "0 0 14px", maxWidth: 360 }}>Luxurious and affordable fragrances. A scent that lingers.</p>
      <a className="btn fit" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"><WaIcon s={20} />Chat with us on WhatsApp</a>
      <div className="ftcols">
        <div><h3>Shop</h3><Link href="/shop">Shop all</Link><Link href="/worth-discovering">Worth Discovering</Link><Link href="/combo">Curate a combo</Link><Link href="/favourites">Favourites</Link></div>
        <div><h3>Help</h3><Link href="/info/about">About us</Link><Link href="/info/contact">Contact</Link><Link href="/info/delivery">Delivery &amp; refund policy</Link><Link href="/info/reviews">Customer reviews</Link><Link href="/orders">Track an order</Link><Link href="/info/privacy">Privacy</Link></div>
        <div><h3>Follow</h3><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><Instagram size={20} strokeWidth={1.5} />Instagram</a><a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer"><TikTok size={20} />TikTok</a></div>
      </div>
      <div className="ftbot"><span>&copy; ScentbyBecca</span><button className="ib" style={{ color: "var(--gold-lt)" }} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={22} strokeWidth={1.5} /></button></div>
    </div></footer>
  );
}
function Gate({ children }: { children: React.ReactNode }) {
  const { error } = useStore();
  if (error === "setup" || error === "load") return <Setup kind={error} />;
  return <>{children}</>;
}
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/admin") || path.startsWith("/reset-password")) return <>{children}</>;
  return <StoreProvider><NavProgress /><ScrollMemory /><AnnouncementBar /><PromoBar /><Header /><main><Gate>{children}</Gate></main><Footer /><Fab /><PromoPopup /><MiniCart /></StoreProvider>;
}
