-- =============================================================================
-- I.A FRAGRANCE — Password-Only Admin Security & Server-Side Authorization
-- 1. Adds server-only admin_sessions and admin_login_attempts tables (RLS locked)
-- 2. Removes email-based admin_users / is_admin() authorization system
-- 3. Locks down direct client mutations on products, orders, store_settings,
--    and storage.objects so all admin writes occur server-side via admin-api
--    Edge Function with service_role after HttpOnly session verification.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADMIN SESSIONS TABLE (SERVER-ONLY VIA SERVICE ROLE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
  ON public.admin_sessions(expires_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke all client access; zero RLS policies = only service_role
REVOKE ALL ON TABLE public.admin_sessions FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. LOGIN RATE-LIMITING TABLE (SERVER-ONLY VIA SERVICE ROLE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  ip_hash text PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_login_attempts FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. REMOVE EMAIL-BASED ADMIN RLS POLICIES & ADMIN_USERS SYSTEM
-- -----------------------------------------------------------------------------

-- Products: keep public read of active items only; block all direct client writes
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Store settings: keep public read; block all direct client writes
DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
CREATE POLICY "Public can read store settings"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;

-- Orders & order_items: block all direct client reads and writes (guest checkout
-- runs through create-order / create_guest_order RPC; admin runs via admin-api)
DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

DROP POLICY IF EXISTS "Admins can read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can delete order_items" ON public.order_items;

-- Storage: keep public read of product-images; block all direct client uploads/deletes
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Remove old email-based admin_users table and is_admin() helper
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP FUNCTION IF EXISTS public.is_admin();
DROP TABLE IF EXISTS public.admin_users;
