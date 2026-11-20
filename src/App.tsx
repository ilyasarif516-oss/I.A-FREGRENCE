import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AboutSection } from './components/AboutSection';
import { AnnouncementBar } from './components/AnnouncementBar';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { CartDrawer } from './components/CartDrawer';
import { ContactSection } from './components/ContactSection';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ProductModal } from './components/ProductModal';
import { ProductsSection } from './components/ProductsSection';
import { PromoBannerSection } from './components/PromoBannerSection';
import { SeoManager } from './components/SeoManager';
import { TestimonialsSection } from './components/TestimonialsSection';
import { WhyChooseUsSection } from './components/WhyChooseUsSection';
import { StoreProvider, useStore } from './context/StoreContext';

function ToastBanner() {
  const { toastMessage } = useStore();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#0B0B0D] text-white text-xs sm:text-sm font-medium shadow-xl border border-white/15 whitespace-nowrap"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductPageRouteSkeleton({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <div className="bg-white min-h-[70vh] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10 animate-pulse">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-medium uppercase tracking-[0.14em] text-[#0B0B0D]/60 cursor-pointer"
        >
          &larr; Back to Collection
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 aspect-[4/4.6] rounded-3xl bg-[#F5EDF1]" />
          <div className="lg:col-span-6 space-y-5 py-4">
            <div className="h-4 w-1/3 bg-black/10 rounded" />
            <div className="h-12 w-3/4 bg-black/10 rounded" />
            <div className="h-7 w-1/4 bg-black/10 rounded" />
            <div className="h-24 w-full bg-black/8 rounded-2xl" />
            <div className="h-12 w-full bg-black/10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductNotFoundView({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-white min-h-[65vh] flex flex-col items-center justify-center px-4 py-20 text-center space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#0B0B0D]/55">
        Catalog Notice
      </p>
      <h1 className="font-display text-4xl font-semibold text-[#0B0B0D]">
        Fragrance Not Found
      </h1>
      <p className="text-sm text-[#0B0B0D]/65 max-w-md leading-relaxed">
        This scent may have been archived or is not yet published. Explore our active collection below.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="px-6 py-3 rounded-full bg-[#0B0B0D] text-white text-xs font-semibold tracking-wide hover:bg-[#222228] transition-colors cursor-pointer"
      >
        Browse Collection
      </button>
    </div>
  );
}

function AppContent() {
  const {
    isAdminRoute,
    activeProductSlug,
    activePageProduct,
    isLoadingStore,
    closeProductPage,
  } = useStore();

  if (isAdminRoute) {
    return (
      <>
        <SeoManager />
        <AdminDashboardPage />
        <ToastBanner />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F9] text-[#0B0B0D]">
      <SeoManager />
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        {activeProductSlug ? (
          activePageProduct ? (
            <ProductDetailPage product={activePageProduct} />
          ) : isLoadingStore ? (
            <ProductPageRouteSkeleton onBack={() => closeProductPage('#shop')} />
          ) : (
            <ProductNotFoundView onBack={() => closeProductPage('#shop')} />
          )
        ) : (
          <>
            <HeroSection />
            <ProductsSection />
            <PromoBannerSection />
            <AboutSection />
            <WhyChooseUsSection />
            <TestimonialsSection />
            <ContactSection />
          </>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <FloatingWhatsAppButton />
      <ToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </MotionConfig>
  );
}
