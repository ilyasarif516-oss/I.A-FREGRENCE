-- =============================================================================
-- I.A FRAGRANCE — Complete Supabase Schema, Seed Data, Storage & RLS Policies
-- =============================================================================

-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. ADMIN AUTHORIZATION TABLE & HELPER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Helper function used across RLS policies to verify store admin privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
       OR (
         au.user_id IS NULL
         AND lower(au.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
         AND COALESCE((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false) = true
       )
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Seed initial store owner email (replace or add your Supabase Auth user_id after creating user in Supabase Auth)
INSERT INTO public.admin_users (email)
VALUES ('ilyasarif516@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER HELPER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order smallint UNIQUE NOT NULL DEFAULT 1,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price numeric(10, 2) CHECK (price IS NULL OR price >= 0),
  image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  volume text NOT NULL DEFAULT '',
  notes jsonb NOT NULL DEFAULT '{"top": "", "heart": "", "base": ""}'::jsonb,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public visitors can read active products; admins can read all products (including inactive slot 2)
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Seed exactly TWO initial products:
-- 1) Pink Lattafa at PKR 2,199 (active)
-- 2) Black Wanted at PKR 2,199 (active, editable from Admin Dashboard)
INSERT INTO public.products (
  sort_order,
  name,
  description,
  price,
  image_url,
  category,
  volume,
  notes,
  stock,
  is_active
)
VALUES
  (
    1,
    'Pink Lattafa',
    'A velvety gourmand-floral signature opening with radiant orchid and heliotrope, resting over creamy sandalwood, vanilla bean, and warm white musk.',
    2199,
    '/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM_f2938b53.jpeg',
    'Signature Eau de Parfum',
    '50 ml',
    '{"top": "Orchid, Heliotrope, Mandarin", "heart": "Gourmand Accord, Tropical Blossoms", "base": "Vanilla, Sandalwood, White Musk"}'::jsonb,
    25,
    true
  ),
  (
    2,
    'Black Wanted',
    'A bold obsidian aromatic signature opening with crisp cardamom and dark bergamot, anchored by smoked cedarwood, ambergris, and velvety black musk.',
    2199,
    '/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM__1__24c2de60.jpeg',
    'Signature Eau de Parfum',
    '50 ml',
    '{"top": "Cardamom, Dark Bergamot, Pink Pepper", "heart": "Smoked Cedarwood, Vetiver, Lavender", "base": "Ambergris, Black Musk, Tonka Bean"}'::jsonb,
    25,
    true
  )
ON CONFLICT (sort_order) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. STORE_SETTINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'I.A FRAGRANCE',
  logo_url text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '+92 300 0000000',
  contact_email text NOT NULL DEFAULT 'concierge@iafragrance.com',
  instagram_url text NOT NULL DEFAULT 'https://instagram.com',
  facebook_url text NOT NULL DEFAULT 'https://facebook.com',
  tiktok_url text NOT NULL DEFAULT 'https://tiktok.com',
  atelier_city text NOT NULL DEFAULT 'Karachi · Lahore · Islamabad',
  concierge_hours text NOT NULL DEFAULT 'Daily, 10:00 AM – 9:00 PM PKT',
  delivery_charges numeric(10, 2) NOT NULL DEFAULT 250 CHECK (delivery_charges >= 0),
  announcement_text text NOT NULL DEFAULT 'Signature Edition · Pink Lattafa Eau de Parfum',
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
CREATE POLICY "Public can read store settings"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
CREATE POLICY "Admins can update store settings"
  ON public.store_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
CREATE POLICY "Admins can insert store settings"
  ON public.store_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

INSERT INTO public.store_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. ORDERS & ORDER_ITEMS TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('IA-' || floor(100000 + random() * 900000)::int::text),
  customer_name text NOT NULL CHECK (char_length(trim(customer_name)) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (char_length(trim(phone)) BETWEEN 7 AND 30),
  email text NOT NULL DEFAULT '',
  city text NOT NULL CHECK (char_length(trim(city)) BETWEEN 2 AND 80),
  complete_address text NOT NULL CHECK (char_length(trim(complete_address)) BETWEEN 5 AND 400),
  order_notes text NOT NULL DEFAULT '',
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_charges numeric(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_charges >= 0),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method text NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'WhatsApp')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 50),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Strict Privacy: Only admins can read, update, or delete orders & order_items.
-- Guest customers place orders through the server-validated RPC function below,
-- so they cannot read other customers' orders or spoof prices/totals.
DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
CREATE POLICY "Admins can read orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read order_items" ON public.order_items;
CREATE POLICY "Admins can read order_items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update order_items" ON public.order_items;
CREATE POLICY "Admins can update order_items"
  ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete order_items" ON public.order_items;
CREATE POLICY "Admins can delete order_items"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. GUEST CHECKOUT RPC (SERVER-CALCULATED PRICING & ATOMIC STOCK UPDATE)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_complete_address text,
  p_order_notes text,
  p_payment_method text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_product record;
  v_qty integer;
  v_subtotal numeric(10, 2) := 0;
  v_delivery numeric(10, 2) := 0;
  v_configured_delivery numeric(10, 2) := 250;
  v_total numeric(10, 2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_created_at timestamptz;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  IF jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'Too many items in a single order.';
  END IF;

  IF p_payment_method NOT IN ('COD', 'WhatsApp') THEN
    RAISE EXCEPTION 'Invalid payment method.';
  END IF;

  -- Calculate subtotal from authoritative product prices and lock stock rows
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item ->> 'quantity')::integer, 0);
    IF v_qty < 1 OR v_qty > 50 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    SELECT id, name, price, stock, is_active
    INTO v_product
    FROM public.products
    WHERE id = (v_item ->> 'product_id')::uuid
    FOR UPDATE;

    IF NOT FOUND OR v_product.is_active IS NOT TRUE OR v_product.price IS NULL THEN
      RAISE EXCEPTION 'Selected product is not available for purchase.';
    END IF;

    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for %.', v_product.name;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  END LOOP;

  SELECT COALESCE(delivery_charges, 250)
  INTO v_configured_delivery
  FROM public.store_settings
  WHERE id = 1;

  IF v_subtotal >= 4000 THEN
    v_delivery := 0;
  ELSE
    v_delivery := v_configured_delivery;
  END IF;

  v_total := v_subtotal + v_delivery;

  INSERT INTO public.orders (
    customer_name,
    phone,
    email,
    city,
    complete_address,
    order_notes,
    subtotal,
    delivery_charges,
    total_amount,
    payment_method,
    order_status
  )
  VALUES (
    trim(p_customer_name),
    trim(p_phone),
    COALESCE(trim(p_email), ''),
    trim(p_city),
    trim(p_complete_address),
    COALESCE(trim(p_order_notes), ''),
    v_subtotal,
    v_delivery,
    v_total,
    p_payment_method,
    'pending'
  )
  RETURNING id, order_number, created_at
  INTO v_order_id, v_order_number, v_created_at;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item ->> 'quantity')::integer;

    SELECT id, name, price
    INTO v_product
    FROM public.products
    WHERE id = (v_item ->> 'product_id')::uuid;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_qty,
      v_product.price,
      v_product.price * v_qty
    );

    UPDATE public.products
    SET stock = stock - v_qty
    WHERE id = v_product.id;
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_charges', v_delivery,
    'total_amount', v_total,
    'payment_method', p_payment_method,
    'order_status', 'pending',
    'created_at', v_created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_order(text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(text, text, text, text, text, text, text, jsonb) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET & RLS POLICIES (PRODUCT IMAGES)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
