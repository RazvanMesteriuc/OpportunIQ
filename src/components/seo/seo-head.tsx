import { useEffect } from "react";
import {
  buildAbsoluteUrl,
  hasLocalBusinessContact,
  SITE_CONTACT,
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_OG_IMAGE,
  SITE_DEFAULT_OG_IMAGE_ALT,
  SITE_DEFAULT_OG_IMAGE_HEIGHT,
  SITE_DEFAULT_OG_IMAGE_TYPE,
  SITE_DEFAULT_OG_IMAGE_WIDTH,
  SITE_NAME,
} from "@/lib/site-config";

type JsonLd = Record<string, unknown>;

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertLink(selector: string, rel: string, href: string) {
  let node = document.head.querySelector<HTMLLinkElement>(selector);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function upsertJsonLd(id: string, payload: JsonLd) {
  let node = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.setAttribute("data-seo-id", id);
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(payload);
}

type SeoHeadProps = {
  title: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  image?: string;
  type?: "website" | "article";
  robots?: string;
  jsonLd?: JsonLd | JsonLd[];
};

export function SeoHead({
  title,
  description = SITE_DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  canonicalUrl,
  image = SITE_DEFAULT_OG_IMAGE,
  type = "website",
  robots = "index,follow",
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    const absoluteCanonical = canonicalUrl ?? buildAbsoluteUrl(canonicalPath);
    document.title = title;

    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", robots);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", absoluteCanonical);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:image"]', "property", "og:image", image);
    upsertMeta('meta[property="og:image:secure_url"]', "property", "og:image:secure_url", image);
    upsertMeta('meta[property="og:image:type"]', "property", "og:image:type", SITE_DEFAULT_OG_IMAGE_TYPE);
    upsertMeta('meta[property="og:image:width"]', "property", "og:image:width", SITE_DEFAULT_OG_IMAGE_WIDTH);
    upsertMeta('meta[property="og:image:height"]', "property", "og:image:height", SITE_DEFAULT_OG_IMAGE_HEIGHT);
    upsertMeta('meta[property="og:image:alt"]', "property", "og:image:alt", SITE_DEFAULT_OG_IMAGE_ALT);
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    upsertMeta('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", SITE_DEFAULT_OG_IMAGE_ALT);
    upsertLink('link[rel="canonical"]', "canonical", absoluteCanonical);

    const defaultGraph: JsonLd[] = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
        description: SITE_DEFAULT_DESCRIPTION,
        logo: buildAbsoluteUrl("/favicon.svg"),
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
        potentialAction: {
          "@type": "SearchAction",
          target: `${buildAbsoluteUrl("/semnale")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ];

    if (hasLocalBusinessContact()) {
      defaultGraph.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: SITE_NAME,
        url: buildAbsoluteUrl("/"),
        telephone: SITE_CONTACT.phone ?? undefined,
        email: SITE_CONTACT.email ?? undefined,
        openingHours: SITE_CONTACT.openingHours ?? undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE_CONTACT.streetAddress,
          addressLocality: SITE_CONTACT.locality,
          addressRegion: SITE_CONTACT.county,
          postalCode: SITE_CONTACT.postalCode ?? undefined,
          addressCountry: "RO",
        },
      });
    }

    upsertJsonLd("default-graph", { "@graph": defaultGraph });

    if (jsonLd) {
      upsertJsonLd("page-graph", Array.isArray(jsonLd) ? { "@graph": jsonLd } : jsonLd);
    } else {
      const existing = document.head.querySelector('script[data-seo-id="page-graph"]');
      existing?.remove();
    }
  }, [canonicalPath, canonicalUrl, description, image, jsonLd, robots, title, type]);

  return null;
}
