import type { MetadataRoute } from "next";
import { SITE } from "@/lib/util";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, sitemap: `${SITE}/sitemap.xml` }; }
