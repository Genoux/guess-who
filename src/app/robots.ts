import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Internal tools by default; public sites must opt in to indexing.
  return { rules: { userAgent: "*", disallow: "/" } };
}
