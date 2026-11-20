-- =============================================================================
-- I.A FRAGRANCE — Update Seed Products with Updated Luxury Studio Bottle Photos
-- Keeps product names (Pink Lattafa & Black Wanted) unchanged.
-- =============================================================================

UPDATE public.products
SET
  image_url = '/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM_f2938b53.jpeg',
  gallery_images = '["/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM_f2938b53.jpeg"]'::jsonb
WHERE sort_order = 1
  AND image_url IN (
    '',
    '/src/assets/images/pink_lattafa_bottle_1795208908287.jpg',
    '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM_bc8d9edf.jpeg'
  );

UPDATE public.products
SET
  image_url = '/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM__1__24c2de60.jpeg',
  gallery_images = '["/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM__1__24c2de60.jpeg"]'::jsonb
WHERE sort_order = 2
  AND image_url IN (
    '',
    '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM__1__3fefab0d.jpeg'
  );
