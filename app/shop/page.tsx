import Shop from "@/components/Shop";
export const metadata = { title: "Shop all fragrances" };
export default function ShopPage({ searchParams }: { searchParams: { cat?: string; sub?: string; q?: string } }) {
  return <Shop cat={searchParams.cat || ""} sub={searchParams.sub || ""} q={searchParams.q || ""} />;
}
