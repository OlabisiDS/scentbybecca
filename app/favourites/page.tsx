"use client";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { useFavs } from "@/lib/hooks";
import { useStore } from "@/lib/store";
export default function Favourites() {
  const { products, ready } = useStore();
  const [favs] = useFavs();
  const list = products.filter((p) => favs.includes(p.id));
  return (
    <>
      <PageHeader title="Your favourites" pageKey="favourites" crumb="Favourites" />
      <div className="wrap pad">
        <p className="muted small">Saved on this device.</p>
        {!ready ? <p className="muted">Loading...</p> : list.length === 0 ? <><p>You have not saved any fragrances yet. Tap the heart on a product to save it here.</p><Link className="btn fit" href="/shop">Explore fragrances</Link></> : <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </>
  );
}
