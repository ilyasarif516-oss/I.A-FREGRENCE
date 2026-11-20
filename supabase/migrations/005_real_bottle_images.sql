-- =============================================================================
-- I.A FRAGRANCE — Update Seed Products with Real Bottle Photography
-- Updates Pink Lattafa (Slot 1) and populates Black Wanted (Slot 2) if blank.
-- =============================================================================

UPDATE public.products
SET
  image_url = '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM_bc8d9edf.jpeg',
  volume = CASE WHEN volume = '' OR volume = '100 ml' THEN '50 ml' ELSE volume END
WHERE sort_order = 1
  AND (image_url = '' OR image_url = '/src/assets/images/pink_lattafa_bottle_1795208908287.jpg');

UPDATE public.products
SET
  slug = 'black-wanted',
  name = 'Black Wanted',
  description = 'A bold obsidian aromatic signature opening with crisp cardamom and dark bergamot, anchored by smoked cedarwood, ambergris, and velvety black musk.',
  price = 2199,
  image_url = '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM__1__3fefab0d.jpeg',
  category = 'Signature Eau de Parfum',
  volume = '50 ml',
  notes = '{"top": "Cardamom, Dark Bergamot, Pink Pepper", "heart": "Smoked Cedarwood, Vetiver, Lavender", "base": "Ambergris, Black Musk, Tonka Bean"}'::jsonb,
  stock = 25,
  is_featured = true,
  is_active = true
WHERE sort_order = 2
  AND name = ''
  AND image_url = ''
  AND price IS NULL;
