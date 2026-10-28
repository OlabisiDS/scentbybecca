import type { Metadata } from "next";
import ProductView from "@/components/ProductView";
import { anonServer } from "@/lib/server";
import { ngn } from "@/lib/util";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const { data } = await anonServer().from("products").select("name, brand, description, images, variants").eq("slug", params.slug).eq("status", "active").maybeSingle();
    if (!data) return { title: "Product" };
    const price = Math.min(...(data.variants as { price: number }[]).map((v) => v.price));
    const description = `${ngn(price)}${(data.variants as unknown[]).length > 1 ? " and up" : ""}. ${data.description || `${data.name} from ScentbyBecca.`}`.slice(0, 200);
    return { title: data.name, description, openGraph: { title: data.name, description, images: data.images?.[0] ? [{ url: data.images[0] }] : undefined }, twitter: { card: "summary_large_image" } };
  } catch { return { title: "Product" }; }
}
export default function ProductPage({ params }: { params: { slug: string } }) { return <ProductView slug={params.slug} />; }
