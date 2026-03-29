import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mailegacy.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/entries/",
          "/family/",
          "/families/",
          "/griot/",
          "/messages/",
          "/goals/",
          "/skills/",
          "/feed/",
          "/help/",
          "/profile/",
          "/settings/",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
