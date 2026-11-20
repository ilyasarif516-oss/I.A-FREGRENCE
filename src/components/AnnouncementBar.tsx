import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';

export function AnnouncementBar() {
  const { contactSettings, openProductPage, pinkLattafa } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const messages = [
    contactSettings.announcementText ||
      'Signature Edition · Pink Lattafa Eau de Parfum',
    `Complimentary Nationwide Delivery on Orders Over ${formatPKR(4000)}`,
    'Cash on Delivery Available Across Pakistan · Hand-Inspected Bottles',
  ].filter(Boolean);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  const currentMessage = messages[activeIndex % messages.length];

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="bg-[#0B0B0D] text-white h-9 px-4 flex items-center justify-center overflow-hidden border-b border-white/10"
    >
      <AnimatePresence mode="wait">
        <motion.button
          key={`${activeIndex}-${currentMessage}`}
          type="button"
          onClick={() => openProductPage(pinkLattafa)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-[11px] sm:text-xs font-medium tracking-[0.14em] uppercase text-[#F4CBD8] hover:text-white transition-colors truncate max-w-full cursor-pointer"
        >
          {currentMessage}
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
