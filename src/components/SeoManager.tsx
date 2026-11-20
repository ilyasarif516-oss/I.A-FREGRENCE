import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_PINK_LATTAFA_IMAGE } from '../data/defaults';

function upsertMetaTag(
  selectorAttr: 'name' | 'property',
  attrValue: string,
  content: string
) {
  let el = document.head.querySelector(
    `meta[${selectorAttr}="${attrValue}"]`
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(selectorAttr, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function upsertJsonLd(schema: Record<string, unknown>) {
  let script = document.getElementById(
    'ia-structured-data'
  ) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'ia-structured-data';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

export function SeoManager() {
  const {
    isAdminRoute,
    activePageProduct,
    products,
    contactSettings,
  } = useStore();

  useEffect(() => {
    const brandName = contactSettings.storeName || 'I.A FRAGRANCE';
    const currentUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : '';

    if (isAdminRoute) {
      document.title = `Admin Console — ${brandName}`;
      upsertMetaTag(
        'name',
        'description',
        `Restricted store administration console for ${brandName}.`
      );
      return;
    }

    if (activePageProduct) {
      const productTitle = `${activePageProduct.name} — ${brandName} | ${
        activePageProduct.edition || 'Eau de Parfum'
      }`;
      const productDesc =
        activePageProduct.description ||
        `Shop ${activePageProduct.name} by ${brandName}. Luxury Eau de Parfum available in Pakistan with Cash on Delivery.`;
      const productImage =
        activePageProduct.imageUrl || DEFAULT_PINK_LATTAFA_IMAGE;

      document.title = productTitle;
      upsertMetaTag('name', 'description', productDesc.slice(0, 160));
      upsertMetaTag('property', 'og:type', 'product');
      upsertMetaTag('property', 'og:title', productTitle);
      upsertMetaTag('property', 'og:description', productDesc.slice(0, 160));
      upsertMetaTag('property', 'og:url', currentUrl);
      upsertMetaTag('property', 'og:image', productImage);
      upsertMetaTag('name', 'twitter:title', productTitle);
      upsertMetaTag('name', 'twitter:description', productDesc.slice(0, 160));
      upsertCanonical(currentUrl);

      upsertJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: activePageProduct.name,
        description: productDesc,
        image:
          activePageProduct.galleryImages.length > 0
            ? activePageProduct.galleryImages
            : [productImage],
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
        offers: {
          '@type': 'Offer',
          url: currentUrl,
          priceCurrency: 'PKR',
          price: activePageProduct.price ?? 0,
          availability:
            activePageProduct.inStock && activePageProduct.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
      });
      return;
    }

    const homeTitle = `${brandName} — Luxury Perfume House & Signature Scents`;
    const homeDesc =
      'Discover I.A FRAGRANCE — luxury Eau de Parfum scents including Pink Lattafa. Shop online in Pakistan with nationwide Cash on Delivery.';

    document.title = homeTitle;
    upsertMetaTag('name', 'description', homeDesc);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('property', 'og:title', homeTitle);
    upsertMetaTag('property', 'og:description', homeDesc);
    upsertMetaTag('property', 'og:url', currentUrl);
    upsertMetaTag('property', 'og:image', DEFAULT_PINK_LATTAFA_IMAGE);
    upsertMetaTag('name', 'twitter:title', homeTitle);
    upsertMetaTag('name', 'twitter:description', homeDesc);
    upsertCanonical(currentUrl);

    const activeProducts = products.filter(
      (p) => p.isActive && Boolean(p.name.trim()) && p.price !== null
    );

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: brandName,
      description: homeDesc,
      url: currentUrl,
      email: contactSettings.email,
      telephone: contactSettings.whatsappNumber,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Signature Fragrances',
        itemListElement: activeProducts.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.imageUrl || DEFAULT_PINK_LATTAFA_IMAGE,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'PKR',
              price: product.price ?? 0,
              availability:
                product.inStock && product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
          },
        })),
      },
    });
  }, [isAdminRoute, activePageProduct, products, contactSettings]);

  return null;
}
