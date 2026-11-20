import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import {
  DEFAULT_BLACK_WANTED_IMAGE,
  DEFAULT_PINK_LATTAFA_IMAGE,
} from '../data/defaults';
import { LuxuryImage } from './LuxuryImage';

export function PromoBannerSection() {
  const { contactSettings, pinkLattafa, secondProduct, navigateToStorefront } =
    useStore();

  const leftBottle = pinkLattafa.imageUrl || DEFAULT_PINK_LATTAFA_IMAGE;
  const rightBottle = secondProduct?.imageUrl || DEFAULT_BLACK_WANTED_IMAGE;

  return (
    <section className="py-14 sm:py-16 bg-[#FAF8F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl bg-[#0B0B0D] text-white grid grid-cols-1 lg:grid-cols-12 items-stretch border border-black/15"
        >
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#F4CBD8]">
              Studio Privilege
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-semibold tracking-wide text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {contactSettings.promoBannerTitle ||
                'Complimentary Nationwide Delivery'}
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-xl">
              {contactSettings.promoBannerSubtitle ||
                'Enjoy free shipping across Pakistan on orders of PKR 4,000 or more, presented in our signature matte-black and blush packaging.'}
            </p>
            <div className="pt-2">
              <a
                href="#shop"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToStorefront('#shop');
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#F4CBD8] text-[#0B0B0D] text-xs font-semibold tracking-wide hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>
                  {contactSettings.promoBannerCta || 'Explore Collection'}
                </span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex items-center justify-center bg-gradient-to-br from-[#141418] to-[#0B0B0D]">
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="aspect-[3/4] rounded-2xl bg-[#141418] border border-white/10 overflow-hidden shadow-lg">
                <LuxuryImage
                  src={leftBottle}
                  alt={`${pinkLattafa.name || 'Pink Lattafa'} by I.A FRAGRANCE`}
                  className="w-full h-full object-cover"
                  fallbackLabel={pinkLattafa.name || 'Pink Lattafa'}
                />
              </div>
              <div className="aspect-[3/4] rounded-2xl bg-[#141418] border border-white/10 overflow-hidden shadow-lg">
                <LuxuryImage
                  src={rightBottle}
                  alt={`${secondProduct?.name || 'Black Wanted'} by I.A FRAGRANCE`}
                  className="w-full h-full object-cover"
                  fallbackLabel={secondProduct?.name || 'Black Wanted'}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
