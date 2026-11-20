import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import {
  DEFAULT_BLACK_WANTED_IMAGE,
  DEFAULT_PINK_LATTAFA_IMAGE,
} from '../data/defaults';
import { LuxuryImage } from './LuxuryImage';

export function AboutSection() {
  const { pinkLattafa, secondProduct } = useStore();
  const primaryImage = pinkLattafa.imageUrl || DEFAULT_PINK_LATTAFA_IMAGE;
  const secondaryImage =
    secondProduct?.imageUrl || DEFAULT_BLACK_WANTED_IMAGE;

  return (
    <section
      id="about"
      className="py-20 sm:py-24 bg-[#FAF8F9] border-t border-b border-black/8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Visual Column: Only I.A FRAGRANCE Signature Bottles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-5"
          >
            <div className="sm:col-span-7 rounded-2xl overflow-hidden border border-black/10 bg-[#141418] min-h-[280px] lg:h-full">
              <LuxuryImage
                src={primaryImage}
                alt={`${pinkLattafa.name || 'Pink Lattafa'} Eau de Parfum by I.A FRAGRANCE`}
                className="w-full h-full object-cover"
                fallbackLabel={pinkLattafa.name || 'Pink Lattafa'}
              />
            </div>

            <div className="sm:col-span-5 flex flex-col gap-5">
              <div className="flex-1 rounded-2xl overflow-hidden border border-black/10 bg-[#141418] min-h-[200px]">
                <LuxuryImage
                  src={secondaryImage}
                  alt={`${secondProduct?.name || 'Black Wanted'} Eau de Parfum by I.A FRAGRANCE`}
                  className="w-full h-full object-cover"
                  fallbackLabel={secondProduct?.name || 'Black Wanted'}
                />
              </div>
              <div className="rounded-2xl bg-[#0B0B0D] text-white p-6 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#F4CBD8]">
                  House Philosophy
                </p>
                <p className="font-display text-xl leading-snug text-white tracking-wide">
                  Scent is the quiet architecture of memory.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Narrative Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center space-y-6"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#0B0B0D]/55">
                Our Brand Story
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0B0B0D] leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                Crafted for Presence, Curated for Identity
              </h2>
            </div>

            <div className="space-y-4 text-[15px] sm:text-base text-[#0B0B0D]/75 leading-[1.75] max-w-xl">
              <p>
                Founded with a singular devotion to modern perfumery,{' '}
                <strong className="font-semibold text-[#0B0B0D]">I.A FRAGRANCE</strong>{' '}
                exists for individuals who view scent not as an accessory, but as an
                unmistakable personal signature. Rather than overwhelming shelves with
                hundreds of fleeting blends, we curate only distinguished compositions
                that command quiet attention from first mist to dry-down.
              </p>
              <p>
                Every flacon that leaves our studio is hand-inspected for concentration,
                atomizer precision, and presentation—uniting rich Middle Eastern warmth
                with minimalist contemporary luxury.
              </p>
            </div>

            <div className="pt-6 border-t border-black/10 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p className="font-display text-2xl sm:text-3xl font-semibold text-[#0B0B0D] tabular-nums">
                  100%
                </p>
                <p className="text-xs text-[#0B0B0D]/60 mt-1">Authentic Curation</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-semibold text-[#0B0B0D] tabular-nums">
                  8–12h
                </p>
                <p className="text-xs text-[#0B0B0D]/60 mt-1">Lasting Sillage</p>
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-semibold text-[#0B0B0D]">
                  COD
                </p>
                <p className="text-xs text-[#0B0B0D]/60 mt-1">Nationwide Service</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
