import { Award, Droplets, Gift, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';

const PILLARS = [
  {
    index: '01',
    title: 'Premium Fragrance',
    description:
      'High-concentration Eau de Parfum formulations selected for radiant projection and refined longevity on skin and fabric.',
    icon: Droplets,
  },
  {
    index: '02',
    title: 'Elegant Packaging',
    description:
      'Signature matte-black and soft-blush presentation crafted to elevate both daily rituals and milestone gifting.',
    icon: Gift,
  },
  {
    index: '03',
    title: 'Quality Experience',
    description:
      'Every bottle undergoes seal, atomizer, and batch inspection prior to dispatch with protective transit cushioning.',
    icon: Award,
  },
  {
    index: '04',
    title: 'Customer Satisfaction',
    description:
      'Transparent PKR pricing, attentive concierge support on WhatsApp, and dependable Cash on Delivery across Pakistan.',
    icon: HeartHandshake,
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-20 sm:py-24 bg-[#0B0B0D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-12 border-b border-white/12">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#F4CBD8]">
              The I.A Standard
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-wide"
              style={{ textWrap: 'balance' }}
            >
              Why Choose Us
            </h2>
          </div>
          <p className="text-sm text-white/70 max-w-md leading-relaxed tracking-[0.01em]">
            Four foundational commitments guiding every scent we select, package, and deliver.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col justify-between p-7 rounded-2xl bg-[#141418] border border-white/10 hover:border-[#F4CBD8]/45 transition-colors duration-300"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium tracking-[0.18em] text-[#F4CBD8] tabular-nums">
                      {pillar.index}
                    </span>
                    <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-[#F4CBD8]">
                      <Icon className="w-4 h-4" strokeWidth={1.6} />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="font-display text-2xl font-medium text-white tracking-wide">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed tracking-[0.01em]">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
