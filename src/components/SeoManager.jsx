import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router";
import { getPageSeo } from "../utils/pageSeo";

function updateMeta(attributes, content) {
  const selector = attributes.name
    ? `meta[name="${attributes.name}"]`
    : `meta[property="${attributes.property}"]`;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export default function SeoManager() {
  const { pathname } = useLocation();
  const seo = useMemo(() => getPageSeo(pathname), [pathname]);

  useEffect(() => {
    const metaValues = [
      [{ name: "title" }, seo.title],
      [{ name: "description" }, seo.description],
      [{ name: "robots" }, seo.robots],
      [{ property: "og:type" }, "website"],
      [{ property: "og:site_name" }, "SpellyCraft"],
      [{ property: "og:url" }, seo.canonical],
      [{ property: "og:title" }, seo.title],
      [{ property: "og:description" }, seo.description],
      [{ name: "twitter:card" }, "summary"],
      [{ name: "twitter:url" }, seo.canonical],
      [{ name: "twitter:title" }, seo.title],
      [{ name: "twitter:description" }, seo.description],
    ];

    for (const [attributes, content] of metaValues) {
      updateMeta(attributes, content);
    }

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", seo.canonical);
  }, [seo]);

  return (
    <Helmet>
      <title>{seo.title}</title>
    </Helmet>
  );
}
