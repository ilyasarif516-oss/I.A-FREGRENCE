-- =============================================================================
-- I.A FRAGRANCE — Direct Admin Access (Remove Password & Login Session Tables)
-- Drops admin_sessions and admin_login_attempts since /admin opens directly
-- without password authentication.
-- =============================================================================

DROP TABLE IF EXISTS public.admin_sessions;
DROP TABLE IF EXISTS public.admin_login_attempts;
