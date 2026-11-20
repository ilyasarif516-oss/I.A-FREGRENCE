-- =============================================================================
-- I.A FRAGRANCE — Storefront Luxury Experience Upgrade Migration
-- 1. Adds product slug, gallery_images (jsonb), and is_featured flag
-- 2. Adds editable promotional banner & testimonials fields to store_settings
-- =============================================================================

-- 1. Extend products table with SEO slug, gallery images, and featured flag
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Backfill Pink Lattafa as featured with SEO-friendly slug
UPDATE public.products
SET
  slug = 'pink-lattafa',
  is_featured = true
WHERE sort_order = 1 AND (slug = '' OR slug IS NULL);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 2. Extend store_settings with promotional banner copy and editable testimonials
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS promo_banner_title text NOT NULL DEFAULT 'Complimentary Nationwide Delivery',
  ADD COLUMN IF NOT EXISTS promo_banner_subtitle text NOT NULL DEFAULT 'Enjoy free shipping across Pakistan on orders of PKR 4,000 or more, presented in our signature matte-black and blush packaging.',
  ADD COLUMN IF NOT EXISTS promo_banner_cta text NOT NULL DEFAULT 'Explore Collection',
  ADD COLUMN IF NOT EXISTS testimonials jsonb NOT NULL DEFAULT '[
    {
      "id": "t-1",
      "name": "Ayesha Siddiqui",
      "location": "Lahore",
      "productPurchased": "Pink Lattafa",
      "quote": "The bottle arrived sealed in the soft-pink gift box and the creamy vanilla-orchid trail stayed on my shawl well into the next afternoon.",
      "rating": 5
    },
    {
      "id": "t-2",
      "name": "Zainab Tariq",
      "location": "Karachi",
      "productPurchased": "Pink Lattafa",
      "quote": "Ordering via Cash on Delivery took under a minute, and WhatsApp concierge confirmed dispatch the very same afternoon. Truly refined presentation.",
      "rating": 5
    },
    {
      "id": "t-3",
      "name": "Hamza Raza",
      "location": "Islamabad",
      "productPurchased": "Pink Lattafa",
      "quote": "Bought Pink Lattafa as an anniversary gift. Between the heavy glass flacon and velvety gourmand dry-down, it feels like an international house.",
      "rating": 5
    }
  ]'::jsonb;
