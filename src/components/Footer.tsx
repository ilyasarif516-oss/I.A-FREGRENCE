import { Instagram, Mail, MessageCircle, Settings2, Share2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppUrl, safeExternalHref } from '../utils/format';

export function Footer() {
  const { contactSettings, activePageProduct, navigateToStorefront, openAdmin } =
    useStore();
  const year = new Date().getFullYear();

  const instagramHref = safeExternalHref(contactSettings.instagramUrl);
  const secondarySocialHref =
    safeExternalHref(contactSettings.facebookUrl) ||
    safeExternalHref(contactSettings.tiktokUrl);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    if (activePageProduct) {
      e.preventDefault();
      navigateToStorefront(hash);
    }
  };

  return (
    <footer className="bg-[#0B0B0D] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, '#home')}
              className="inline-flex items-center gap-3 font-display text-2xl font-semibold tracking-[0.2em] uppercase text-white"
            >
              {contactSettings.logoUrl ? (
                <img
                  src={contactSettings.logoUrl}
                  alt={contactSettings.storeName}
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto max-w-[140px] object-contain brightness-0 invert"
                />
              ) : (
                <span>{contactSettings.storeName || 'I.A FRAGRANCE'}</span>
              )}
            </a>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm tracking-[0.01em]">
              A contemporary luxury perfume house dedicated to unforgettable signatures,
              refined presentation, and timeless presence.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#F4CBD8]">
              Navigation
            </p>
            <ul className="space-y-2.5 text-sm text-white/75">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleLinkClick(e, '#home')}
                  className="hover:text-[#F4CBD8] transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#shop"
                  onClick={(e) => handleLinkClick(e, '#shop')}
                  className="hover:text-[#F4CBD8] transition-colors"
                >
                  Shop Collection
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleLinkClick(e, '#about')}
                  className="hover:text-[#F4CBD8] transition-colors"
                >
                  About the House
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleLinkClick(e, '#contact')}
                  className="hover:text-[#F4CBD8] transition-colors"
                >
                  Contact Concierge
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Store Studio Column */}
          <div className="md:col-span-4 space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#F4CBD8]">
              Connect &amp; Studio
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {contactSettings.whatsappNumber && (
                <a
                  href={buildWhatsAppUrl(contactSettings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:border-[#F4CBD8] hover:text-[#F4CBD8] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                </a>
              )}
              {contactSettings.email && (
                <a
                  href={`mailto:${contactSettings.email}`}
                  aria-label="Email"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:border-[#F4CBD8] hover:text-[#F4CBD8] transition-colors"
                >
                  <Mail className="w-4 h-4" strokeWidth={1.75} />
                </a>
              )}
              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:border-[#F4CBD8] hover:text-[#F4CBD8] transition-colors"
                >
                  <Instagram className="w-4 h-4" strokeWidth={1.75} />
                </a>
              )}
              {secondarySocialHref && (
                <a
                  href={secondarySocialHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Social Media"
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:border-[#F4CBD8] hover:text-[#F4CBD8] transition-colors"
                >
                  <Share2 className="w-4 h-4" strokeWidth={1.75} />
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => openAdmin('overview')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-xs font-medium text-white/80 hover:border-[#F4CBD8] hover:text-[#F4CBD8] transition-colors cursor-pointer min-h-[38px]"
            >
              <Settings2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>&copy; {year} {contactSettings.storeName || 'I.A FRAGRANCE'}. All rights reserved.</p>
          <p>Luxury Perfumery · Hand-Inspected Packaging</p>
        </div>
      </div>
    </footer>
  );
}
