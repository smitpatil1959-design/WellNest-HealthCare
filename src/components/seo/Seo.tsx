import { useEffect } from 'react';
import { appConfig } from '../../config/app';

export function Seo({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    const nextTitle = title ? `${title} · ${appConfig.name}` : appConfig.name;
    document.title = nextTitle;

    const ensure = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let node = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute(attr, name);
        document.head.appendChild(node);
      }
      node.setAttribute('content', content);
    };

    const desc = description ?? appConfig.description;
    ensure('description', desc);
    ensure('og:title', nextTitle, 'property');
    ensure('og:description', desc, 'property');
    ensure('og:type', 'website', 'property');
    const canonicalUrl = new URL(appConfig.websiteUrl);
    canonicalUrl.pathname = window.location.pathname;
    ensure('og:url', canonicalUrl.href, 'property');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl.href;
    ensure('twitter:card', 'summary_large_image');
    ensure('twitter:title', nextTitle);
    ensure('twitter:description', desc);
  }, [title, description]);

  return null;
}
