-- =============================================================================
-- I.A FRAGRANCE — Admin Dashboard Enhancements Migration
-- 1. Allows unlimited future products (removes UNIQUE constraint on sort_order)
-- 2. Adds 'processing' order status
-- 3. Adds homepage promotional fields (hero_heading, hero_subheading)
-- 4. Strengthens is_admin() JWT email verification check
-- =============================================================================

-- 1. Allow unlimited products by dropping UNIQUE constraint on sort_order
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_sort_order_key;

ALTER TABLE public.products
  ALTER COLUMN sort_order SET DEFAULT 99;

-- 2. Expand order_status constraint to include 'processing'
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- 3. Add homepage promotional content columns to store_settings
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS hero_heading text NOT NULL DEFAULT 'YOUR FRAGRANCE, YOUR IDENTITY.',
  ADD COLUMN IF NOT EXISTS hero_subheading text NOT NULL DEFAULT 'Discover the art of unforgettable fragrance.';

-- 4. Strengthen explicit admin authorization helper
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
         AND COALESCE(
           (auth.jwt() ->> 'email_verified')::boolean,
           (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
           false
         ) = true
       )
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
