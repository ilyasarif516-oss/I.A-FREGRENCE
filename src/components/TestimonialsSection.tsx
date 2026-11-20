import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export function TestimonialsSection() {
  const { contactSettings } = useStore();
  const testimonials = contactSettings.testimonials ?? [];

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 sm:py-24 bg-white border-t border-black/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 mb-12 border-b border-black/10">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#0B0B0D]/55">
              Client Impressions
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0B0B0D]"
              style={{ textWrap: 'balance' }}
            >
              Worn &amp; Remembered
            </h2>
          </div>
          <p className="text-sm text-[#0B0B0D]/65 max-w-md leading-relaxed">
            Verified impressions from fragrance collectors and gift buyers across Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((item, idx) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col justify-between p-7 rounded-2xl bg-[#FAF8F9] border border-black/10 space-y-6"
            >
              <div className="space-y-4">
                <div
                  className="flex items-center gap-1 text-[#0B0B0D]"
                  aria-label={`${item.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${
                        starIdx < item.rating
                          ? 'fill-[#0B0B0D] text-[#0B0B0D]'
                          : 'text-[#0B0B0D]/20'
                      }`}
                    />
                  ))}
                </div>

                <blockquote className="text-sm sm:text-[15px] text-[#0B0B0D]/80 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>

              <div className="pt-4 border-t border-black/8 flex items-baseline justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-[#0B0B0D]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
                    {item.location}
                    {item.productPurchased ? ` · ${item.productPurchased}` : ''}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
