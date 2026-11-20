import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { formatPKR } from '../utils/format';
import { LuxuryImage } from './LuxuryImage';

export function ProductModal() {
  const { selectedProduct, setSelectedProduct, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [selectedProduct?.id]);

  const handleClose = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const maxStock = selectedProduct ? Math.max(0, selectedProduct.stock) : 0;
  const isAvailable = Boolean(
    selectedProduct &&
      selectedProduct.inStock &&
      selectedProduct.isActive &&
      maxStock > 0 &&
      selectedProduct.price !== null
  );

  return (
    <AnimatePresence>
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/10 grid grid-cols-1 md:grid-cols-12 max-h-[90vh]"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close product details"
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 border border-black/10 flex items-center justify-center text-[#0B0B0D] hover:bg-[#0B0B0D] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="md:col-span-6 bg-[#141418] aspect-[4/4.5] md:aspect-auto">
              <LuxuryImage
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                fallbackLabel={selectedProduct.name}
              />
            </div>

            <div className="md:col-span-6 p-7 sm:p-9 overflow-y-auto flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[#0B0B0D]/55">
                    <span>
                      {selectedProduct.edition || 'Eau de Parfum'}
                      {selectedProduct.volume ? ` · ${selectedProduct.volume}` : ''}
                    </span>
                    <span className="tabular-nums font-medium text-[#0B0B0D]/75">
                      {!isAvailable ? 'Out of Stock' : `${maxStock} in stock`}
                    </span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0D]">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xl font-semibold text-[#0B0B0D] tabular-nums">
                    {selectedProduct.price !== null
                      ? formatPKR(selectedProduct.price)
                      : 'Price TBD'}
                  </p>
                </div>

                {selectedProduct.description && (
                  <p className="text-sm text-[#0B0B0D]/75 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                {(selectedProduct.notes.top ||
                  selectedProduct.notes.heart ||
                  selectedProduct.notes.base) && (
                  <div className="pt-4 border-t border-black/10 space-y-2.5 text-xs">
                    <p className="uppercase tracking-[0.16em] text-[#0B0B0D]/55 font-medium">
                      Olfactory Pyramid
                    </p>
                    {selectedProduct.notes.top && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#0B0B0D]/55">Top Notes</span>
                        <span className="text-right font-medium text-[#0B0B0D]">
                          {selectedProduct.notes.top}
                        </span>
                      </div>
                    )}
                    {selectedProduct.notes.heart && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#0B0B0D]/55">Heart Notes</span>
                        <span className="text-right font-medium text-[#0B0B0D]">
                          {selectedProduct.notes.heart}
                        </span>
                      </div>
                    )}
                    {selectedProduct.notes.base && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#0B0B0D]/55">Base Notes</span>
                        <span className="text-right font-medium text-[#0B0B0D]">
                          {selectedProduct.notes.base}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-black/10 flex items-center gap-3">
                <div className="inline-flex items-center border border-black/15 rounded-full bg-white h-11">
                  <button
                    type="button"
                    disabled={!isAvailable || quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-full flex items-center justify-center hover:bg-black/5 disabled:opacity-40 rounded-l-full cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!isAvailable || quantity >= maxStock}
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-full flex items-center justify-center hover:bg-black/5 disabled:opacity-40 rounded-r-full cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    addToCart(selectedProduct, quantity);
                    handleClose();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#F4CBD8]" strokeWidth={1.75} />
                  <span>{isAvailable ? 'Add to Cart' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
