import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/store';
import { formatPKR } from '../utils/format';
import { LuxuryImage } from './LuxuryImage';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';
type AvailabilityFilter = 'all' | 'in-stock' | 'featured';

function ConfiguredProductCard({ product }: { product: Product }) {
  const { addToCart, openProductPage } = useStore();

  const isAvailable =
    product.inStock && product.stock > 0 && product.price !== null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col bg-white border border-black/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(11,11,13,0.09)]"
    >
      <div
        onClick={() => openProductPage(product)}
        className="relative aspect-[4/4.3] w-full overflow-hidden bg-[#141418] cursor-pointer"
      >
        <LuxuryImage
          src={product.imageUrl}
          alt={`${product.name} ${product.volume || 'Eau de Parfum'} bottle by I.A FRAGRANCE`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          fallbackLabel={product.name}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openProductPage(product);
          }}
          aria-label={`View ${product.name} details`}
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-[#0B0B0D] text-xs font-medium border border-black/10 hover:bg-[#0B0B0D] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>View Details</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 gap-5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.14em] text-[#0B0B0D]/55">
            <span className="truncate">
              {product.edition || 'Eau de Parfum'}
              {product.volume ? ` · ${product.volume}` : ''}
            </span>
            <span
              className={`shrink-0 font-semibold tabular-nums ${
                !isAvailable
                  ? 'text-[#DC2626]'
                  : product.stock <= 5
                    ? 'text-[#D97706]'
                    : 'text-[#16A34A]'
              }`}
            >
              {!isAvailable
                ? 'Out of Stock'
                : product.stock <= 5
                  ? `Only ${product.stock} left`
                  : 'In Stock'}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <h3
              onClick={() => openProductPage(product)}
              className="font-display text-2xl sm:text-[28px] font-semibold text-[#0B0B0D] leading-tight cursor-pointer hover:underline underline-offset-4"
            >
              {product.name}
            </h3>
            <p className="text-base sm:text-lg font-semibold text-[#0B0B0D] tabular-nums shrink-0">
              {product.price !== null ? formatPKR(product.price) : 'Price TBD'}
            </p>
          </div>

          {product.description && (
            <p className="text-sm text-[#0B0B0D]/68 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-black/8 flex items-center gap-3">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => addToCart(product, 1)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
          >
            <ShoppingBag className="w-4 h-4 text-[#F4CBD8]" strokeWidth={1.75} />
            <span>{isAvailable ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function EditableSlotPlaceholderCard() {
  const { openAdmin } = useStore();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col bg-white border border-dashed border-black/20 rounded-2xl overflow-hidden"
    >
      <div className="relative aspect-[4/4.3] w-full bg-gradient-to-br from-[#FAF8F9] via-[#FDF5F8] to-[#F4CBD8]/35 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full border border-black/15 bg-white flex items-center justify-center mb-5 shadow-sm">
          <Plus className="w-6 h-6 text-[#0B0B0D]" strokeWidth={1.5} />
        </div>
        <p className="text-xs uppercase tracking-[0.16em] text-[#0B0B0D]/55 mb-2">
          Product Slot 02
        </p>
        <h3 className="font-display text-2xl sm:text-[28px] font-semibold text-[#0B0B0D]">
          Awaiting Configuration
        </h3>
        <p className="mt-2.5 text-sm text-[#0B0B0D]/65 max-w-xs leading-relaxed">
          Set the fragrance name, bottle photograph, and PKR price through the Admin Dashboard.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 gap-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#0B0B0D]/50">
            <span>Editable Catalog Entry</span>
            <span>Admin Configurable</span>
          </div>
          <p className="text-sm text-[#0B0B0D]/65">
            No details are pre-filled until you publish your second signature scent.
          </p>
        </div>

        <div className="pt-2 border-t border-black/8">
          <button
            type="button"
            onClick={() => openAdmin('products')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-[#0B0B0D] bg-white text-[#0B0B0D] text-sm font-medium hover:bg-[#0B0B0D] hover:text-white transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0B0D]"
          >
            <Settings2 className="w-4 h-4" strokeWidth={1.75} />
            <span>Configure in Admin Dashboard</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ProductLoadingSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-black/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/4.3] w-full bg-[#F5EDF1]" />
      <div className="p-6 sm:p-7 space-y-4">
        <div className="flex justify-between">
          <div className="h-3 w-1/3 bg-black/10 rounded" />
          <div className="h-3 w-1/5 bg-black/10 rounded" />
        </div>
        <div className="flex justify-between items-baseline">
          <div className="h-7 w-1/2 bg-black/10 rounded" />
          <div className="h-5 w-1/4 bg-black/10 rounded" />
        </div>
        <div className="h-4 w-full bg-black/8 rounded" />
        <div className="h-11 w-full bg-black/10 rounded-full mt-2" />
      </div>
    </div>
  );
}

export function ProductsSection() {
  const {
    products,
    isLoadingStore,
    storeError,
    retryLoadStore,
    openAdmin,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [editionFilter, setEditionFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  const activeProducts = useMemo(
    () =>
      products.filter(
        (p) => p.isActive && Boolean(p.name.trim()) && p.price !== null
      ),
    [products]
  );

  const availableEditions = useMemo(() => {
    const set = new Set<string>();
    for (const item of activeProducts) {
      if (item.edition.trim()) {
        set.add(item.edition.trim());
      }
    }
    return Array.from(set);
  }, [activeProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = activeProducts.filter((product) => {
      if (availabilityFilter === 'in-stock' && (!product.inStock || product.stock <= 0)) {
        return false;
      }
      if (availabilityFilter === 'featured' && !product.isFeatured) {
        return false;
      }
      if (editionFilter !== 'all' && product.edition.trim() !== editionFilter) {
        return false;
      }
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.edition.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.notes.top.toLowerCase().includes(q) ||
        product.notes.heart.toLowerCase().includes(q) ||
        product.notes.base.toLowerCase().includes(q)
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortOption === 'price-asc') {
        return (a.price ?? 0) - (b.price ?? 0);
      }
      if (sortOption === 'price-desc') {
        return (b.price ?? 0) - (a.price ?? 0);
      }
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      // Featured / curated order
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.slot - b.slot;
    });
    return sorted;
  }, [activeProducts, searchQuery, availabilityFilter, editionFilter, sortOption]);

  const isFiltering =
    searchQuery.trim().length > 0 ||
    availabilityFilter !== 'all' ||
    editionFilter !== 'all';

  // Preserve editable Slot 2 preview card when < 2 active configured products exist and not filtered out
  const showPlaceholderSlot = activeProducts.length < 2 && !isFiltering;
  const totalRendered =
    filteredAndSortedProducts.length + (showPlaceholderSlot ? 1 : 0);

  return (
    <section id="shop" className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 pb-6 border-b border-black/10">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#0B0B0D]/55">
              Curated Collection
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0B0B0D]"
              style={{ textWrap: 'balance' }}
            >
              Featured &amp; Signature Fragrances
            </h2>
          </div>

          <button
            type="button"
            onClick={() => openAdmin('products')}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D]/80 hover:border-black hover:text-[#0B0B0D] transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Settings2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Manage Products</span>
          </button>
        </div>

        {/* Search, Filter & Sort Toolbar */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#0B0B0D]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search perfumes or notes..."
              aria-label="Search perfumes"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FAF8F9] border border-black/15 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#FAF8F9] border border-black/10">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'featured', label: 'Featured' },
                  { id: 'in-stock', label: 'In Stock' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAvailabilityFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    availabilityFilter === tab.id
                      ? 'bg-[#0B0B0D] text-white'
                      : 'text-[#0B0B0D]/70 hover:text-[#0B0B0D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {availableEditions.length > 1 && (
              <select
                aria-label="Filter by category or edition"
                value={editionFilter}
                onChange={(e) => setEditionFilter(e.target.value)}
                className="px-3.5 py-2 rounded-full bg-[#FAF8F9] border border-black/15 text-xs font-medium text-[#0B0B0D] focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] cursor-pointer"
              >
                <option value="all">All Editions</option>
                {availableEditions.map((ed) => (
                  <option key={ed} value={ed}>
                    {ed}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Sort products"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3.5 py-2 rounded-full bg-[#FAF8F9] border border-black/15 text-xs font-medium text-[#0B0B0D] focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {storeError && (
          <div
            role="alert"
            className="mb-8 p-4 rounded-2xl bg-[#FDF5F8] border border-[#D997AD] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-[#0B0B0D]"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#0B0B0D]" />
              <div>
                <p className="font-semibold">Could not refresh live catalog</p>
                <p className="text-xs text-[#0B0B0D]/70 mt-0.5">{storeError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => retryLoadStore()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0B0D] text-white text-xs font-medium hover:bg-[#222228] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {isLoadingStore ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <ProductLoadingSkeleton />
            <ProductLoadingSkeleton />
          </div>
        ) : totalRendered === 0 ? (
          <div className="p-12 rounded-2xl border border-black/10 bg-[#FAF8F9] text-center space-y-3">
            <p className="font-display text-2xl font-semibold text-[#0B0B0D]">
              No matching fragrances
            </p>
            <p className="text-sm text-[#0B0B0D]/65">
              Try clearing your search or switching back to all fragrances.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAvailabilityFilter('all');
                setEditionFilter('all');
              }}
              className="px-5 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              totalRendered >= 3 ? 'lg:grid-cols-3' : ''
            } gap-8 lg:gap-12`}
          >
            {filteredAndSortedProducts.map((product) => (
              <ConfiguredProductCard key={product.id} product={product} />
            ))}
            {showPlaceholderSlot && <EditableSlotPlaceholderCard />}
          </div>
        )}
      </div>
    </section>
  );
}
