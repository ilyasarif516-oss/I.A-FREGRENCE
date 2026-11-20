import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';
import { LuxuryImage } from './LuxuryImage';

export function HeroSection() {
  const { pinkLattafa, secondProduct, contactSettings, openProductPage } =
    useStore();
  const [promoIndex, setPromoIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState<'primary' | 'secondary'>('primary');

  const heroProducts = useMemo(() => {
    const list = [pinkLattafa];
    if (
      secondProduct &&
      secondProduct.isActive &&
      Boolean(secondProduct.name.trim()) &&
      Boolean(secondProduct.imageUrl.trim())
    ) {
      list.push(secondProduct);
    }
    return list;
  }, [pinkLattafa, secondProduct]);

  const activeProduct =
    activeSlot === 'secondary' && heroProducts[1]
      ? heroProducts[1]
      : heroProducts[0];

  const promoMessages = [
    contactSettings.announcementText ||
      'Signature Edition · Pink Lattafa & Black Wanted Eau de Parfum',
    'Hand-Inspected Luxury Presentation · Nationwide Delivery',
    'Curated Scents Crafted for Lasting Identity',
  ];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoMessages.length);
    }, 4200);
    return () => window.clearInterval(interval);
  }, [promoMessages.length]);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F9] via-[#FDF5F8]/70 to-white border-b border-black/5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#F4CBD8]/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/4 w-[320px] h-[320px] rounded-full bg-[#F4CBD8]/20 blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-6 space-y-8">
            <div className="h-6 overflow-hidden flex items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${promoIndex}-${promoMessages[promoIndex]}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs sm:text-sm font-medium tracking-[0.16em] uppercase text-[#0B0B0D]/70"
                >
                  {promoMessages[promoIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <h1
                className="font-display font-semibold tracking-tight text-[#0B0B0D] leading-[1.03]"
                style={{
                  fontSize: 'clamp(2.65rem, 4.7vw, 4.5rem)',
                  textWrap: 'balance',
                }}
              >
                {contactSettings.heroHeading || 'YOUR FRAGRANCE, YOUR IDENTITY.'}
              </h1>

              <p className="text-base sm:text-lg text-[#0B0B0D]/70 max-w-xl leading-relaxed">
                {contactSettings.heroSubheading ||
                  'Discover the art of unforgettable fragrance.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 sm:gap-5"
            >
              <a
                href="#shop"
                className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#0B0B0D] text-white text-sm font-medium tracking-wide hover:bg-[#222228] transition-all duration-200 shadow-[0_12px_28px_rgba(11,11,13,0.18)] hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D] focus-visible:ring-offset-2"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 text-[#F4CBD8]" strokeWidth={1.75} />
              </a>

              <a
                href="#about"
                className="inline-flex items-center px-5 py-3.5 rounded-full border border-black/15 bg-white/80 text-[#0B0B0D] text-sm font-medium hover:border-black/40 hover:bg-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
              >
                Explore the House
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="pt-4 border-t border-black/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#0B0B0D]/60 tracking-wide"
            >
              <span>Eau de Parfum</span>
              <span aria-hidden="true">·</span>
              <span>{activeProduct.volume || '50 ml'} Signature Flacon</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-medium text-[#0B0B0D]">
                {activeProduct.price !== null
                  ? formatPKR(activeProduct.price)
                  : 'PKR 2,199'}
              </span>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[460px] mx-auto space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-[28px] bg-[#0B0B0D] p-3 sm:p-4 shadow-[0_28px_70px_rgba(11,11,13,0.16)]"
              >
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative aspect-[3/3.75] w-full rounded-[20px] overflow-hidden bg-[#141418]"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeProduct.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full h-full"
                    >
                      <LuxuryImage
                        src={activeProduct.imageUrl}
                        alt={`${activeProduct.name} ${activeProduct.volume || '50 ml'} Eau de Parfum bottle by I.A FRAGRANCE`}
                        loading="eager"
                        fetchPriority="high"
                        className="w-full h-full object-cover"
                        fallbackLabel={activeProduct.name}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-4 text-white">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#F4CBD8]">
                        Signature Release
                      </p>
                      <p className="font-display text-2xl font-medium tracking-wide">
                        {activeProduct.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openProductPage(activeProduct)}
                      className="px-4 py-2 rounded-full bg-white/95 text-[#0B0B0D] text-xs font-semibold tracking-wide hover:bg-[#F4CBD8] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Inspect Bottle
                    </button>
                  </div>
                </motion.div>
              </motion.div>

              {heroProducts.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Signature bottles"
                  className="grid grid-cols-2 gap-3"
                >
                  {heroProducts.slice(0, 2).map((item, idx) => {
                    const slotKey = idx === 0 ? 'primary' : 'secondary';
                    const isSelected = activeProduct.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveSlot(slotKey)}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B0B0D] text-white border-[#0B0B0D] shadow-[0_10px_24px_rgba(11,11,13,0.14)]'
                            : 'bg-white text-[#0B0B0D] border-black/10 hover:border-black/35'
                        }`}
                      >
                        <div className="w-12 h-14 rounded-xl bg-[#141418] border border-black/10 shrink-0 overflow-hidden">
                          <LuxuryImage
                            src={item.imageUrl}
                            alt={`${item.name} bottle preview`}
                            loading="eager"
                            className="w-full h-full object-cover"
                            fallbackLabel={item.name}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-[10px] uppercase tracking-[0.14em] truncate ${
                              isSelected ? 'text-[#F4CBD8]' : 'text-[#0B0B0D]/55'
                            }`}
                          >
                            {item.volume || '50 ml'}
                          </p>
                          <p className="font-display text-lg font-semibold leading-tight truncate">
                            {item.name}
                          </p>
                          <p
                            className={`text-xs tabular-nums ${
                              isSelected ? 'text-white/80' : 'text-[#0B0B0D]/65'
                            }`}
                          >
                            {item.price !== null ? formatPKR(item.price) : 'PKR 2,199'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
