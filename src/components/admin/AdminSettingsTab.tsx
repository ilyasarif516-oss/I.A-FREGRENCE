import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ContactSettings, TestimonialItem } from '../../types/store';

function isSafeLinkOrEmpty(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/')
  );
}

export function AdminSettingsTab() {
  const {
    contactSettings,
    isSupabaseConnected,
    uploadAssetImage,
    updateContactSettings,
    resetStoreDefaults,
    showToast,
  } = useStore();

  const [form, setForm] = useState<ContactSettings>(contactSettings);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setForm(contactSettings);
  }, [contactSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setSavedNotice(false);
    try {
      setIsUploadingLogo(true);
      const url = await uploadAssetImage(file, 'branding');
      setForm((prev) => ({ ...prev, logoUrl: url }));
      showToast('Logo uploaded. Save settings to publish.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to upload brand logo.'
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddTestimonial = () => {
    const nextItem: TestimonialItem = {
      id: `t-${Date.now()}`,
      name: '',
      location: '',
      productPurchased: 'Pink Lattafa',
      quote: '',
      rating: 5,
    };
    setForm((prev) => ({
      ...prev,
      testimonials: [...(prev.testimonials ?? []), nextItem],
    }));
  };

  const handleUpdateTestimonial = (
    id: string,
    patch: Partial<TestimonialItem>
  ) => {
    setForm((prev) => ({
      ...prev,
      testimonials: (prev.testimonials ?? []).map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleRemoveTestimonial = (id: string) => {
    setForm((prev) => ({
      ...prev,
      testimonials: (prev.testimonials ?? []).filter((item) => item.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSavedNotice(false);

    if (!form.storeName.trim()) {
      setErrorMessage('Brand name is required.');
      return;
    }

    if (
      !isSafeLinkOrEmpty(form.logoUrl) ||
      !isSafeLinkOrEmpty(form.instagramUrl) ||
      !isSafeLinkOrEmpty(form.facebookUrl) ||
      !isSafeLinkOrEmpty(form.tiktokUrl)
    ) {
      setErrorMessage(
        'Links and image URLs must start with https://, http://, or /.'
      );
      return;
    }

    const cleanTestimonials = (form.testimonials ?? [])
      .map((t) => ({
        ...t,
        name: t.name.trim(),
        location: t.location.trim(),
        productPurchased: t.productPurchased.trim(),
        quote: t.quote.trim(),
        rating: Math.min(5, Math.max(1, Math.round(t.rating || 5))),
      }))
      .filter((t) => t.name && t.quote);

    try {
      setIsSaving(true);
      await updateContactSettings({
        ...form,
        storeName: form.storeName.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        email: form.email.trim(),
        deliveryCharges: Math.max(
          0,
          Math.round(Number(form.deliveryCharges) || 0)
        ),
        announcementText: form.announcementText.trim(),
        heroHeading: form.heroHeading.trim(),
        heroSubheading: form.heroSubheading.trim(),
        promoBannerTitle: form.promoBannerTitle.trim(),
        promoBannerSubtitle: form.promoBannerSubtitle.trim(),
        promoBannerCta: form.promoBannerCta.trim(),
        testimonials: cleanTestimonials,
      });
      setSavedNotice(true);
      showToast('Store settings saved.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save store settings.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setErrorMessage(null);
    setSavedNotice(false);
    try {
      setIsResetting(true);
      await resetStoreDefaults();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to restore defaults.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#FDF5F8] border border-[#D997AD] flex items-start gap-2.5 text-sm text-[#0B0B0D]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Brand & Logo Card */}
      <section className="bg-white border border-black/10 rounded-2xl p-6 space-y-5">
        <div className="pb-4 border-b border-black/8">
          <h2 className="text-base font-semibold text-[#0B0B0D]">
            Brand Identity &amp; Logo
          </h2>
          <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
            Controls your storefront header logo, brand name, and footer copy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl border border-black/10 bg-[#FAF8F9] min-h-[120px]">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt={form.storeName}
                className="max-h-16 max-w-full object-contain"
              />
            ) : (
              <span className="font-display text-lg font-semibold tracking-[0.2em] uppercase text-[#0B0B0D] text-center">
                {form.storeName || 'I.A FRAGRANCE'}
              </span>
            )}
          </div>

          <div className="sm:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-medium hover:bg-[#222228] transition-colors cursor-pointer">
                {isUploadingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4CBD8]" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-[#F4CBD8]" />
                )}
                <span>
                  {isUploadingLogo
                    ? 'Uploading Logo...'
                    : `Upload Logo${isSupabaseConnected ? ' (Storage)' : ''}`}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                  className="sr-only"
                />
              </label>

              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/15 text-xs font-medium text-[#DC2626] hover:border-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.storeName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, storeName: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
                  Logo URL (Optional)
                </label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Homepage Promotional Content */}
      <section className="bg-white border border-black/10 rounded-2xl p-6 space-y-5">
        <div className="pb-4 border-b border-black/8">
          <h2 className="text-base font-semibold text-[#0B0B0D]">
            Homepage Promotional Content &amp; Banner
          </h2>
          <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
            Customize the announcement bar, hero copy, and studio promotional banner.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Announcement Bar Text
            </label>
            <input
              type="text"
              value={form.announcementText}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, announcementText: e.target.value }))
              }
              placeholder="Signature Edition · Pink Lattafa Eau de Parfum"
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Hero Headline
            </label>
            <input
              type="text"
              value={form.heroHeading}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, heroHeading: e.target.value }))
              }
              placeholder="YOUR FRAGRANCE, YOUR IDENTITY."
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Hero Subheading
            </label>
            <input
              type="text"
              value={form.heroSubheading}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, heroSubheading: e.target.value }))
              }
              placeholder="Discover the art of unforgettable fragrance."
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="pt-3 border-t border-black/8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
                Promotional Banner Title
              </label>
              <input
                type="text"
                value={form.promoBannerTitle}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    promoBannerTitle: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
                Banner Button Label
              </label>
              <input
                type="text"
                value={form.promoBannerCta}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, promoBannerCta: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
                Promotional Banner Description
              </label>
              <textarea
                rows={2}
                value={form.promoBannerSubtitle}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    promoBannerSubtitle: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] resize-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Editable Testimonials Section */}
      <section className="bg-white border border-black/10 rounded-2xl p-6 space-y-5">
        <div className="pb-4 border-b border-black/8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0B0B0D]">
              Customer Testimonials
            </h2>
            <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
              Add, edit, or remove client reviews shown on the public storefront.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTestimonial}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/15 text-xs font-medium text-[#0B0B0D] hover:border-black cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Testimonial</span>
          </button>
        </div>

        <div className="space-y-4">
          {(form.testimonials ?? []).map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#FAF8F9] border border-black/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0B0B0D]/55">
                  Review #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTestimonial(item.id)}
                  aria-label={`Remove testimonial ${idx + 1}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleUpdateTestimonial(item.id, { name: e.target.value })
                  }
                  placeholder="Customer Name"
                  className="px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                />
                <input
                  type="text"
                  value={item.location}
                  onChange={(e) =>
                    handleUpdateTestimonial(item.id, { location: e.target.value })
                  }
                  placeholder="City (e.g. Lahore)"
                  className="px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                />
                <input
                  type="text"
                  value={item.productPurchased}
                  onChange={(e) =>
                    handleUpdateTestimonial(item.id, {
                      productPurchased: e.target.value,
                    })
                  }
                  placeholder="Perfume Purchased"
                  className="px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                />
              </div>

              <textarea
                rows={2}
                value={item.quote}
                onChange={(e) =>
                  handleUpdateTestimonial(item.id, { quote: e.target.value })
                }
                placeholder="Customer feedback quote..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] resize-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Contact, Delivery & Social Channels */}
      <section className="bg-white border border-black/10 rounded-2xl p-6 space-y-5">
        <div className="pb-4 border-b border-black/8">
          <h2 className="text-base font-semibold text-[#0B0B0D]">
            Contact, Delivery &amp; Social Channels
          </h2>
          <p className="text-xs text-[#0B0B0D]/55 mt-0.5">
            Configure WhatsApp concierge, email, COD delivery charges, and social profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))
              }
              placeholder="+92 300 0000000"
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Contact Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="concierge@iafragrance.com"
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Standard Delivery Charges (PKR)
            </label>
            <input
              type="number"
              min="0"
              value={form.deliveryCharges}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryCharges: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
            <p className="text-[11px] text-[#0B0B0D]/50">
              Orders of PKR 4,000 or more automatically receive complimentary delivery.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Concierge Hours
            </label>
            <input
              type="text"
              value={form.conciergeHours}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, conciergeHours: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Shipping / Atelier Cities
            </label>
            <input
              type="text"
              value={form.atelierCity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, atelierCity: e.target.value }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Instagram URL
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instagramUrl: e.target.value }))
              }
              placeholder="https://instagram.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              Facebook URL
            </label>
            <input
              type="url"
              value={form.facebookUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, facebookUrl: e.target.value }))
              }
              placeholder="https://facebook.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/65">
              TikTok URL
            </label>
            <input
              type="url"
              value={form.tiktokUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tiktokUrl: e.target.value }))
              }
              placeholder="https://tiktok.com/@..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
            />
          </div>
        </div>
      </section>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="button"
          disabled={isResetting || isSaving}
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/15 bg-white text-xs font-medium text-[#0B0B0D] hover:border-black transition-colors cursor-pointer disabled:opacity-60"
        >
          {isResetting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          <span>Restore Store Defaults</span>
        </button>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving || isUploadingLogo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B0B0D] text-white text-xs font-semibold tracking-wide hover:bg-[#222228] transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSaving ? 'Saving...' : 'Save Store Settings'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
