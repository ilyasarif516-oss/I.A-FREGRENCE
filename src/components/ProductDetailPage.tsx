import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { buildWhatsAppUrl, formatPKR } from '../utils/format';
import { LuxuryImage } from './LuxuryImage';

export function ProductDetailPage({ product }: { product: Product }) {
  const {
    products,
    contactSettings,
    addToCart,
    openProductPage,
    closeProductPage,
  } = useStore();

  const gallery = useMemo(() => {
    const items = [
      product.imageUrl,
      ...(product.galleryImages ?? []),
    ].filter((u) => typeof u === 'string' && u.trim().length > 0);
    return Array.from(new Set(items));
  }, [product.imageUrl, product.galleryImages]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
  }, [product.id]);

  const activeImageSrc = gallery[activeImageIndex] ?? product.imageUrl;
  const maxStock = Math.max(0, product.stock);
  const isAvailable =
    product.inStock &&
    product.isActive &&
    maxStock > 0 &&
    product.price !== null;

  const relatedProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.id !== product.id &&
        p.isActive &&
        Boolean(p.name.trim()) &&
        p.price !== null
    );
  }, [products, product.id]);

  const whatsappUrl = buildWhatsAppUrl(
    contactSettings.whatsappNumber,
    `Hello ${contactSettings.storeName || 'I.A FRAGRANCE'}, I have a question about ${product.name} (${
      product.price ? formatPKR(product.price) : 'Signature Fragrance'
    }).`
  );

  return (
    <div className="bg-white min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-16">
        {/* Breadcrumb & Back Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-black/10"
        >
          <button
            type="button"
            onClick={() => closeProductPage('#shop')}
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#0B0B0D]/75 hover:text-[#0B0B0D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Collection</span>
          </button>

          <ol className="flex items-center gap-2 text-xs text-[#0B0B0D]/55">
            <li>
              <button
                type="button"
                onClick={() => closeProductPage('#home')}
                className="hover:text-[#0B0B0D] cursor-pointer"
              >
                Home
              </button>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <button
                type="button"
                onClick={() => closeProductPage('#shop')}
                className="hover:text-[#0B0B0D] cursor-pointer"
              >
                Shop
              </button>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#0B0B0D] font-medium truncate max-w-[180px]">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main PDP Two-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Product Image Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 lg:sticky lg:top-24 space-y-4"
          >
            <div className="aspect-[4/4.6] w-full rounded-3xl overflow-hidden bg-[#141418] border border-black/10 shadow-[0_24px_60px_rgba(11,11,13,0.08)]">
              <LuxuryImage
                src={activeImageSrc}
                alt={`${product.name} ${product.volume || 'Eau de Parfum'} bottle — view ${activeImageIndex + 1}`}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover"
                fallbackLabel={product.name}
              />
            </div>

            {gallery.length > 1 && (
              <div
                role="tablist"
                aria-label="Product gallery thumbnails"
                className="grid grid-cols-4 sm:grid-cols-5 gap-3"
              >
                {gallery.map((imgSrc, idx) => {
                  const isActive = idx === activeImageIndex;
                  return (
                    <button
                      key={`${imgSrc}-${idx}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`View ${product.name} photograph ${idx + 1}`}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`aspect-square rounded-2xl overflow-hidden border transition-all cursor-pointer bg-[#141418] ${
                        isActive
                          ? 'border-[#0B0B0D] ring-2 ring-[#0B0B0D]/20'
                          : 'border-black/10 opacity-70 hover:opacity-100 hover:border-black/35'
                      }`}
                    >
                      <LuxuryImage
                        src={imgSrc}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        fallbackLabel={product.name}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Right: Contiguous Purchase Module */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-7"
          >
            <div className="space-y-3 pb-6 border-b border-black/10">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[#0B0B0D]/60">
                <span>
                  {product.edition || 'Eau de Parfum'}
                  {product.volume ? ` · ${product.volume}` : ''}
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    !isAvailable
                      ? 'text-[#DC2626]'
                      : maxStock <= 5
                        ? 'text-[#D97706]'
                        : 'text-[#16A34A]'
                  }`}
                >
                  {!isAvailable
                    ? 'Out of Stock'
                    : maxStock <= 5
                      ? `Low Stock · Only ${maxStock} left`
                      : `In Stock · ${maxStock} ready to ship`}
                </span>
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl font-semibold text-[#0B0B0D] leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                {product.name}
              </h1>

              <p className="text-2xl font-semibold text-[#0B0B0D] tabular-nums pt-1">
                {product.price !== null ? formatPKR(product.price) : 'Price TBD'}
              </p>
            </div>

            {product.description && (
              <p className="text-[15px] sm:text-base text-[#0B0B0D]/75 leading-[1.75]">
                {product.description}
              </p>
            )}

            {/* Olfactory Pyramid */}
            {(product.notes.top || product.notes.heart || product.notes.base) && (
              <div className="p-6 rounded-2xl bg-[#FAF8F9] border border-black/10 space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#0B0B0D]/60">
                  Olfactory Architecture
                </p>
                <div className="divide-y divide-black/8 text-sm">
                  {product.notes.top && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55">Top Notes</span>
                      <span className="font-medium text-[#0B0B0D] text-right">
                        {product.notes.top}
                      </span>
                    </div>
                  )}
                  {product.notes.heart && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55">Heart Notes</span>
                      <span className="font-medium text-[#0B0B0D] text-right">
                        {product.notes.heart}
                      </span>
                    </div>
                  )}
                  {product.notes.base && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55">Base Notes</span>
                      <span className="font-medium text-[#0B0B0D] text-right">
                        {product.notes.base}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quantity & Purchase Controls */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="inline-flex items-center justify-between border border-black/15 rounded-full bg-white h-12 px-1 sm:w-36">
                  <button
                    type="button"
                    disabled={!isAvailable || quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/5 disabled:opacity-35 rounded-full cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!isAvailable || quantity >= maxStock}
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/5 disabled:opacity-35 rounded-full cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => addToCart(product, quantity)}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#F4CBD8]" strokeWidth={1.75} />
                  <span>
                    {isAvailable
                      ? `Add to Cart · ${
                          product.price !== null
                            ? formatPKR(product.price * quantity)
                            : ''
                        }`
                      : 'Currently Out of Stock'}
                  </span>
                </button>
              </div>

              {whatsappUrl !== '#contact' && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full border border-black/15 bg-white text-[#0B0B0D] text-xs font-semibold hover:border-black transition-colors"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                  <span>Ask Concierge About {product.name} on WhatsApp</span>
                </a>
              )}
            </div>

            {/* Delivery & Authenticity Assurances */}
            <div className="pt-4 border-t border-black/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#0B0B0D]/70">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#0B0B0D] shrink-0 mt-0.5" strokeWidth={1.6} />
                <div>
                  <p className="font-semibold text-[#0B0B0D]">Cash on Delivery</p>
                  <p className="mt-0.5">Free over {formatPKR(4000)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0B0B0D] shrink-0 mt-0.5" strokeWidth={1.6} />
                <div>
                  <p className="font-semibold text-[#0B0B0D]">Batch Inspected</p>
                  <p className="mt-0.5">Sealed luxury bottle</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B0B0D] shrink-0 mt-0.5" strokeWidth={1.6} />
                <div>
                  <p className="font-semibold text-[#0B0B0D]">No Account Needed</p>
                  <p className="mt-0.5">Fast guest checkout</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Fragrances Section */}
        {relatedProducts.length > 0 && (
          <section className="pt-12 border-t border-black/10 space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#0B0B0D]/55">
                  Pair or Explore
                </p>
                <h2 className="font-display text-3xl font-semibold text-[#0B0B0D] mt-1">
                  Related Fragrances
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.slice(0, 3).map((rel) => (
                <article
                  key={rel.id}
                  onClick={() => openProductPage(rel)}
                  className="group cursor-pointer flex flex-col bg-white border border-black/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(11,11,13,0.08)]"
                >
                  <div className="aspect-[4/4.2] bg-[#141418] overflow-hidden">
                    <LuxuryImage
                      src={rel.imageUrl}
                      alt={`${rel.name} perfume bottle`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      fallbackLabel={rel.name}
                    />
                  </div>
                  <div className="p-5 flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[#0B0B0D]/55 truncate">
                        {rel.edition || 'Eau de Parfum'}
                      </p>
                      <h3 className="font-display text-2xl font-semibold text-[#0B0B0D] truncate">
                        {rel.name}
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-[#0B0B0D] tabular-nums shrink-0">
                      {rel.price !== null ? formatPKR(rel.price) : 'Price TBD'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
