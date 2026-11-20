import React, { useState } from 'react';
import {
  AlertCircle,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { DEFAULT_PINK_LATTAFA_IMAGE } from '../../data/defaults';
import { Product } from '../../types/store';
import { formatPKR } from '../../utils/format';
import { LuxuryImage } from '../LuxuryImage';

interface ProductFormState {
  name: string;
  price: string;
  stock: string;
  edition: string;
  volume: string;
  description: string;
  imageUrl: string;
  galleryImages: string[];
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  isFeatured: boolean;
  isActive: boolean;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  price: '',
  stock: '20',
  edition: 'Eau de Parfum',
  volume: '100 ml',
  description: '',
  imageUrl: '',
  galleryImages: [],
  topNotes: '',
  heartNotes: '',
  baseNotes: '',
  isFeatured: false,
  isActive: true,
};

export function AdminProductsTab() {
  const {
    products,
    isSupabaseConnected,
    uploadAssetImage,
    createProduct,
    updateProductById,
    deleteProductById,
    showToast,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formState, setFormState] = useState<ProductFormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.edition.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsAddMode(true);
    setFormState(EMPTY_FORM);
    setFormError(null);
  };

  const openEditModal = (product: Product) => {
    const isUnconfiguredDraft =
      !product.name.trim() && product.price === null && !product.isActive;
    setIsAddMode(false);
    setEditingProduct(product);
    setFormState({
      name: product.name,
      price: product.price !== null ? String(product.price) : '',
      stock: String(isUnconfiguredDraft && product.stock === 0 ? 20 : product.stock ?? 0),
      edition: product.edition || 'Eau de Parfum',
      volume: product.volume || '100 ml',
      description: product.description,
      imageUrl: product.imageUrl,
      galleryImages: (product.galleryImages ?? []).filter(
        (img) => img !== product.imageUrl
      ),
      topNotes: product.notes.top,
      heartNotes: product.notes.heart,
      baseNotes: product.notes.base,
      isFeatured: product.isFeatured,
      isActive: isUnconfiguredDraft ? true : product.isActive,
    });
    setFormError(null);
  };

  const closeFormModal = () => {
    setIsAddMode(false);
    setEditingProduct(null);
    setFormError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    try {
      setIsUploading(true);
      const url = await uploadAssetImage(
        file,
        editingProduct ? `slot-${editingProduct.slot}` : 'catalog'
      );
      setFormState((prev) => ({ ...prev, imageUrl: url }));
      showToast('Primary bottle image uploaded. Save to apply.');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to upload image.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    try {
      setIsUploadingGallery(true);
      const url = await uploadAssetImage(
        file,
        editingProduct ? `slot-${editingProduct.slot}-gallery` : 'catalog-gallery'
      );
      setFormState((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, url],
      }));
      showToast('Gallery image added. Save to apply.');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to upload gallery image.'
      );
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericPrice = Number(formState.price);
    const numericStock = Math.max(0, Math.round(Number(formState.stock) || 0));

    if (!formState.name.trim()) {
      setFormError('Please enter a perfume name.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError('Please enter a valid price in PKR.');
      return;
    }

    const normalizedGallery = Array.from(
      new Set(
        [formState.imageUrl.trim(), ...formState.galleryImages.map((g) => g.trim())]
          .filter(Boolean)
      )
    );

    try {
      setIsSaving(true);
      if (isAddMode) {
        await createProduct({
          name: formState.name.trim(),
          price: Math.round(numericPrice),
          stock: numericStock,
          edition: formState.edition.trim() || 'Eau de Parfum',
          volume: formState.volume.trim() || '100 ml',
          description: formState.description.trim(),
          imageUrl: formState.imageUrl.trim(),
          galleryImages: normalizedGallery,
          notes: {
            top: formState.topNotes.trim(),
            heart: formState.heartNotes.trim(),
            base: formState.baseNotes.trim(),
          },
          isFeatured: formState.isFeatured,
          isActive: formState.isActive,
        });
        showToast(`${formState.name.trim()} added to catalog.`);
      } else if (editingProduct) {
        await updateProductById(editingProduct.id, {
          name: formState.name.trim(),
          price: Math.round(numericPrice),
          stock: numericStock,
          edition: formState.edition.trim(),
          volume: formState.volume.trim(),
          description: formState.description.trim(),
          imageUrl: formState.imageUrl.trim(),
          galleryImages: normalizedGallery,
          notes: {
            top: formState.topNotes.trim(),
            heart: formState.heartNotes.trim(),
            base: formState.baseNotes.trim(),
          },
          isFeatured: formState.isFeatured,
          isActive: formState.isActive,
        });
        showToast(`${formState.name.trim()} updated.`);
      }
      closeFormModal();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save product.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    if (
      !product.isActive &&
      (!product.name.trim() || product.price === null || product.price <= 0)
    ) {
      openEditModal(product);
      showToast('Set product name and PKR price before activating.');
      return;
    }

    try {
      setTogglingId(product.id);
      await updateProductById(product.id, { isActive: !product.isActive });
      showToast(
        !product.isActive
          ? `${product.name} is now live on the storefront.`
          : `${product.name} deactivated.`
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to toggle product status.'
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteProductById(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete product.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#0B0B0D]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search perfumes..."
            aria-label="Search perfumes"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-semibold tracking-wide hover:bg-[#222228] transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[42px]"
        >
          <Plus className="w-4 h-4 text-[#F4CBD8]" />
          <span>Add New Perfume</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="font-display text-2xl font-semibold text-[#0B0B0D]">
              No matching perfumes
            </p>
            <p className="text-sm text-[#0B0B0D]/60">
              Try clearing your search or add a new fragrance to your catalog.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F4CBD8]" />
              <span>Add New Perfume</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs text-[#0B0B0D]/55 uppercase tracking-[0.12em] bg-[#FAF8F9]">
                  <th className="py-3.5 px-5 font-medium">Perfume</th>
                  <th className="py-3.5 px-4 font-medium">Price</th>
                  <th className="py-3.5 px-4 font-medium">Stock</th>
                  <th className="py-3.5 px-4 font-medium">Visibility</th>
                  <th className="py-3.5 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[#FAF8F9]/60 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-[#141418] border border-black/10 shrink-0">
                          <LuxuryImage
                            src={product.imageUrl}
                            alt={product.name || 'Draft perfume'}
                            className="w-full h-full object-cover"
                            fallbackLabel={product.name || `Slot ${product.slot}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0B0B0D] truncate">
                            {product.name || `Unconfigured Slot #${product.slot}`}
                          </p>
                          <p className="text-xs text-[#0B0B0D]/55 truncate">
                            {product.edition || 'Eau de Parfum'}
                            {product.volume ? ` · ${product.volume}` : ''}
                            {product.isFeatured ? ' · Featured' : ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-[#0B0B0D] tabular-nums whitespace-nowrap">
                      {product.price !== null ? formatPKR(product.price) : 'Not set'}
                    </td>

                    <td className="py-4 px-4 tabular-nums whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          product.stock <= 0
                            ? 'text-[#DC2626]'
                            : product.stock <= 5
                              ? 'text-[#D97706]'
                              : 'text-[#0B0B0D]'
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={togglingId === product.id}
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                          product.isActive
                            ? 'border-[#16A34A]/30 bg-[#16A34A]/8 text-[#16A34A]'
                            : 'border-black/15 bg-black/5 text-[#0B0B0D]/65 hover:border-black/35'
                        }`}
                      >
                        <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          aria-label={`Delete ${product.name || 'product'}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-black/15 text-[#DC2626] hover:bg-[#DC2626] hover:text-white hover:border-[#DC2626] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Product Modal */}
      <AnimatePresence>
        {(isAddMode || editingProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeFormModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={isAddMode ? 'Add New Perfume' : 'Edit Perfume'}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/10 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 bg-[#0B0B0D] text-white flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold">
                  {isAddMode ? 'Add New Perfume' : `Edit ${editingProduct?.name || 'Perfume'}`}
                </h3>
                <button
                  type="button"
                  onClick={closeFormModal}
                  aria-label="Close modal"
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleFormSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-5"
              >
                {formError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-[#FDF5F8] border border-[#D997AD] flex items-start gap-2.5 text-xs text-[#0B0B0D]"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Primary Bottle Photo */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center p-4 rounded-2xl border border-black/10 bg-[#FAF8F9]">
                  <div className="sm:col-span-4 aspect-[3/4] rounded-xl overflow-hidden bg-[#141418] border border-black/10">
                    <LuxuryImage
                      src={formState.imageUrl}
                      alt={formState.name || 'Perfume preview'}
                      className="w-full h-full object-cover"
                      fallbackLabel={formState.name || 'Bottle Preview'}
                    />
                  </div>

                  <div className="sm:col-span-8 space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Primary Product Image{' '}
                      {isSupabaseConnected ? '(Supabase Storage)' : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-medium hover:bg-[#222228] transition-colors cursor-pointer">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4CBD8]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-[#F4CBD8]" />
                        )}
                        <span>
                          {isUploading ? 'Uploading...' : 'Upload Bottle Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="sr-only"
                        />
                      </label>

                      {editingProduct?.slot === 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              imageUrl: DEFAULT_PINK_LATTAFA_IMAGE,
                            }))
                          }
                          className="px-3.5 py-2 rounded-full border border-black/15 bg-white text-xs font-medium text-[#0B0B0D] hover:border-black cursor-pointer"
                        >
                          Use Studio Pink Lattafa
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={formState.imageUrl}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }
                      placeholder="Or paste image URL"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>
                </div>

                {/* Secondary Gallery Images */}
                <div className="p-4 rounded-2xl border border-black/10 bg-[#FAF8F9] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Product Gallery Images ({formState.galleryImages.length})
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/15 bg-white text-xs font-medium text-[#0B0B0D] hover:border-black cursor-pointer">
                      {isUploadingGallery ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isUploadingGallery ? 'Uploading...' : 'Add Gallery Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={handleGalleryUpload}
                        disabled={isUploadingGallery}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {formState.galleryImages.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {formState.galleryImages.map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-black/15 bg-white"
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            aria-label="Remove gallery photo"
                            onClick={() =>
                              setFormState((prev) => ({
                                ...prev,
                                galleryImages: prev.galleryImages.filter(
                                  (_, i) => i !== idx
                                ),
                              }))
                            }
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Perfume Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g. Velvet Oud"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formState.price}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, price: e.target.value }))
                      }
                      placeholder="2499"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formState.stock}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, stock: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Category / Edition
                    </label>
                    <input
                      type="text"
                      value={formState.edition}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, edition: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Volume
                    </label>
                    <input
                      type="text"
                      value={formState.volume}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, volume: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the scent profile and longevity..."
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formState.topNotes}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, topNotes: e.target.value }))
                    }
                    placeholder="Top notes"
                    aria-label="Top notes"
                    className="px-3.5 py-2 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                  />
                  <input
                    type="text"
                    value={formState.heartNotes}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        heartNotes: e.target.value,
                      }))
                    }
                    placeholder="Heart notes"
                    aria-label="Heart notes"
                    className="px-3.5 py-2 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                  />
                  <input
                    type="text"
                    value={formState.baseNotes}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, baseNotes: e.target.value }))
                    }
                    placeholder="Base notes"
                    aria-label="Base notes"
                    className="px-3.5 py-2 rounded-xl border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2.5 text-sm text-[#0B0B0D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#0B0B0D]"
                    />
                    <span>Active on storefront</span>
                  </label>

                  <label className="inline-flex items-center gap-2.5 text-sm text-[#0B0B0D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isFeatured}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          isFeatured: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#0B0B0D]"
                    />
                    <span>Featured fragrance</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-black/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-5 py-2.5 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading || isUploadingGallery}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-semibold hover:bg-[#222228] disabled:opacity-60 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isAddMode ? 'Create Perfume' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirm product deletion"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 border border-black/10 shadow-2xl space-y-5"
            >
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-semibold text-[#0B0B0D]">
                  Delete Perfume?
                </h3>
                <p className="text-sm text-[#0B0B0D]/70 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="font-semibold text-[#0B0B0D]">
                    {deleteTarget.name || `Slot #${deleteTarget.slot}`}
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] disabled:opacity-60 cursor-pointer"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
