"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
const STEPS = ["Shopping bag", "Delivery and payment", "Confirmation"];
// A photo header with the page name. The photo is set in Admin > Page headers. Without one, a soft gold gradient shows.
export default function PageHeader({ title, pageKey, image, crumb, steps }: { title: string; pageKey?: string; image?: string; crumb?: string; steps?: number }) {
  const { headers } = useStore();
  const img = image || (pageKey ? headers[pageKey] : "") || "";
  return (
    <>
      <header className={"pgh" + (img ? " img" : "")} style={img ? { backgroundImage: `url(${img})` } : undefined}>
        {img && <div className="ov" aria-hidden="true" />}
        <div><div className="pc"><Link href="/">Home</Link>{crumb ? ` / ${crumb}` : ""}</div><h1>{title}</h1></div>
      </header>
      {steps !== undefined && <div className="steps3" aria-label="Checkout steps">{STEPS.map((s, i) => <span key={s} className={i <= steps ? "on" : ""}>{s}</span>)}</div>}
    </>
  );
}
