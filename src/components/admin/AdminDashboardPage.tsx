import { useState } from 'react';
import {
  ExternalLink,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { AdminSection, OrderRecord } from '../../types/store';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminProductsTab } from './AdminProductsTab';
import { AdminSettingsTab } from './AdminSettingsTab';

const NAV_ITEMS: Array<{
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'settings', label: 'Store Settings', icon: Settings },
];

export function AdminDashboardPage() {
  const {
    contactSettings,
    activeAdminSection,
    setActiveAdminSection,
    navigateToStorefront,
    orders,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inspectedOrder, setInspectedOrder] = useState<OrderRecord | null>(null);

  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'pending'
  ).length;

  const activeNavMeta =
    NAV_ITEMS.find((item) => item.id === activeAdminSection) ?? NAV_ITEMS[0];

  const handleSelectSection = (section: AdminSection) => {
    setActiveAdminSection(section);
    setMobileMenuOpen(false);
  };

  const handleInspectOrder = (order: OrderRecord) => {
    setInspectedOrder(order);
    setActiveAdminSection('orders');
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0B0B0D] text-white">
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#F4CBD8]">
          Admin Console
        </p>
        <p className="font-display text-xl font-semibold tracking-[0.14em] uppercase mt-1 truncate">
          {contactSettings.storeName || 'I.A FRAGRANCE'}
        </p>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 p-4 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeAdminSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSection(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-[#0B0B0D] font-semibold'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#0B0B0D]' : 'text-[#F4CBD8]'
                  }`}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </span>
              {item.id === 'orders' && pendingOrdersCount > 0 && (
                <span
                  className={`text-[11px] font-semibold tabular-nums ${
                    isActive ? 'text-[#D97706]' : 'text-[#F4CBD8]'
                  }`}
                >
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => navigateToStorefront()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/20 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#F4CBD8]" />
          <span>View Storefront</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F9] text-[#0B0B0D] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close admin menu"
                className="absolute top-5 right-4 w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/10 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden w-10 h-10 rounded-full border border-black/15 flex items-center justify-center text-[#0B0B0D] hover:border-black cursor-pointer shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#0B0B0D]/50">
                Admin / {activeNavMeta.label}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B0B0D] truncate">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigateToStorefront()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Storefront</span>
              <span className="sm:hidden">Store</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeAdminSection === 'overview' && (
            <AdminOverviewTab onSelectOrder={handleInspectOrder} />
          )}
          {activeAdminSection === 'products' && <AdminProductsTab />}
          {activeAdminSection === 'orders' && (
            <AdminOrdersTab
              selectedOrder={inspectedOrder}
              onSelectOrder={setInspectedOrder}
              onCloseOrder={() => setInspectedOrder(null)}
            />
          )}
          {activeAdminSection === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
}
