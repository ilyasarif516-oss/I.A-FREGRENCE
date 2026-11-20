import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppUrl } from '../utils/format';

export function FloatingWhatsAppButton() {
  const { contactSettings, isCartOpen, isAdminRoute } = useStore();

  if (isAdminRoute || isCartOpen || !contactSettings.whatsappNumber.trim()) {
    return null;
  }

  const href = buildWhatsAppUrl(
    contactSettings.whatsappNumber,
    `Hello ${contactSettings.storeName || 'I.A FRAGRANCE'}, I would like assistance with an order.`
  );

  if (href === '#contact') return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with I.A FRAGRANCE on WhatsApp"
      title="Chat on WhatsApp"
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0B0B0D] text-[#F4CBD8] border border-[#F4CBD8]/45 shadow-[0_10px_28px_rgba(11,11,13,0.26)] flex items-center justify-center hover:bg-[#1E1E24] hover:border-[#F4CBD8] hover:text-white hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D] focus-visible:ring-offset-2"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-5 h-5 fill-current"
      >
        <path d="M12.03 2C6.5 2 2.02 6.48 2.02 12.01c0 1.76.46 3.48 1.33 4.99L2 22l5.13-1.34a9.97 9.97 0 0 0 4.9 1.28h.01c5.52 0 10-4.48 10-10.01C22.04 6.48 17.56 2 12.03 2Zm5.82 14.22c-.25.7-1.44 1.33-2 1.42-.51.08-1.17.11-1.88-.12-.44-.14-1-.33-1.72-.64-3.02-1.3-4.99-4.34-5.14-4.54-.15-.2-1.23-1.63-1.23-3.11 0-1.48.78-2.21 1.05-2.51.28-.3.61-.38.81-.38h.58c.19 0 .44-.07.69.52.25.6.86 2.09.94 2.24.08.15.13.33.03.53-.1.2-.15.33-.3.5-.15.18-.32.4-.45.54-.15.15-.3.31-.13.61.18.3.78 1.29 1.68 2.09 1.15 1.03 2.13 1.35 2.43 1.5.3.15.48.13.66-.08.18-.2.75-.88.95-1.18.2-.3.4-.25.68-.15.28.1 1.77.84 2.07.99.3.15.5.22.58.35.08.13.08.73-.17 1.43Z" />
      </svg>
    </motion.a>
  );
}
