import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Shop', href: '#shop' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function Navbar() {
  const {
    cartCount,
    contactSettings,
    activePageProduct,
    navigateToStorefront,
    setIsCartOpen,
    openAdmin,
  } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    setIsMobileMenuOpen(false);
    if (activePageProduct) {
      e.preventDefault();
      navigateToStorefront(href);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/92 backdrop-blur-md border-b border-black/10 shadow-[0_4px_24px_rgba(11,11,13,0.04)]'
          : 'bg-[#FAF8F9]/85 backdrop-blur-sm border-b border-black/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark / Optional Uploaded Logo */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, '#home')}
          className="inline-flex items-center gap-2.5 font-display text-xl sm:text-2xl font-semibold tracking-[0.2em] uppercase text-[#0B0B0D] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
        >
          {contactSettings.logoUrl ? (
            <img
              src={contactSettings.logoUrl}
              alt={`${contactSettings.storeName || 'I.A FRAGRANCE'} logo`}
              referrerPolicy="no-referrer"
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <span>{contactSettings.storeName || 'I.A FRAGRANCE'}</span>
          )}
        </a>

        {/* Zone 2: Desktop Navigation Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0B0B0D]/75"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="relative py-1 hover:text-[#0B0B0D] transition-colors whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#0B0B0D] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"
              />
            </a>
          ))}
        </nav>

        {/* Zone 3: Shopping Bag Action + Mobile Hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping cart, ${cartCount} items`}
            className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-black/15 bg-white hover:bg-[#0B0B0D] hover:text-white text-[#0B0B0D] transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
            <span className="text-xs font-semibold tracking-wider uppercase hidden sm:inline">
              Bag
            </span>
            <motion.span
              key={cartCount}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#F4CBD8] text-[#0B0B0D] text-[11px] font-semibold tabular-nums"
              aria-live="polite"
            >
              {cartCount}
            </motion.span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-black/10 bg-white text-[#0B0B0D] hover:bg-black/5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-black/10 bg-white px-6 py-5 space-y-1 shadow-lg"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center justify-between py-3 text-base font-medium text-[#0B0B0D] border-b border-black/5 last:border-b-0"
              >
                <span>{link.label}</span>
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openAdmin('overview');
              }}
              className="w-full text-left py-3 text-sm font-medium text-[#0B0B0D]/65 hover:text-[#0B0B0D] transition-colors cursor-pointer"
            >
              Admin Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
