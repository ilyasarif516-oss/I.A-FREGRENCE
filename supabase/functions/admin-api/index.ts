// Supabase Edge Function: admin-api
// Direct admin panel backend using service_role for admin CRUD operations
// (products, orders, store settings, and image uploads) with input validation
// and CSRF origin/header verification.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const VALID_ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (configured.length > 0) {
      return configured.includes(origin);
    }

    if (parsed.protocol === 'https:') return true;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-requested-with',
    Vary: 'Origin',
  };

  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

function jsonResponse(
  req: Request,
  status: number,
  payload: unknown,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...buildCorsHeaders(req),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isMutationCsrfSafe(req: Request): boolean {
  const origin = req.headers.get('origin') ?? '';
  if (!isAllowedOrigin(origin)) {
    return false;
  }
  const requestedWith = req.headers.get('x-requested-with');
  return requestedWith === 'ia-fragrance-admin';
}

function getServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server configuration error.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sanitizeProductPayload(raw: Record<string, unknown>, isCreate: boolean) {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (isCreate && !name) {
    throw new Error('Product name is required.');
  }

  const parsedPrice =
    raw.price === null || raw.price === undefined || raw.price === ''
      ? null
      : Number(raw.price);
  if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
    throw new Error('Product price must be a non-negative number.');
  }

  const stock = Math.max(0, Math.round(Number(raw.stock ?? 0)));
  if (!Number.isFinite(stock)) {
    throw new Error('Stock must be a valid number.');
  }

  const notesRaw =
    raw.notes && typeof raw.notes === 'object'
      ? (raw.notes as Record<string, unknown>)
      : {};
  const gallery = Array.isArray(raw.gallery_images)
    ? raw.gallery_images.filter(
        (u): u is string => typeof u === 'string' && u.trim().length > 0
      )
    : undefined;

  const payload: Record<string, unknown> = {
    name,
    description:
      typeof raw.description === 'string' ? raw.description.trim() : '',
    price: parsedPrice,
    image_url: typeof raw.image_url === 'string' ? raw.image_url.trim() : '',
    category: typeof raw.category === 'string' ? raw.category.trim() : '',
    volume: typeof raw.volume === 'string' ? raw.volume.trim() : '',
    notes: {
      top: typeof notesRaw.top === 'string' ? notesRaw.top.trim() : '',
      heart: typeof notesRaw.heart === 'string' ? notesRaw.heart.trim() : '',
      base: typeof notesRaw.base === 'string' ? notesRaw.base.trim() : '',
    },
    stock,
    is_active: Boolean(raw.is_active),
  };

  if (typeof raw.sort_order === 'number' && Number.isFinite(raw.sort_order)) {
    payload.sort_order = Math.max(1, Math.round(raw.sort_order));
  }
  if (typeof raw.slug === 'string' && raw.slug.trim()) {
    payload.slug = raw.slug.trim();
  }
  if (gallery !== undefined) {
    payload.gallery_images = gallery;
  }
  if (raw.is_featured !== undefined) {
    payload.is_featured = Boolean(raw.is_featured);
  }

  return payload;
}

async function handleProducts(
  req: Request,
  db: SupabaseClient,
  url: URL
): Promise<Response> {
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return jsonResponse(req, 500, { error: error.message });
    }
    return jsonResponse(req, 200, { products: data ?? [] });
  }

  if (req.method === 'POST') {
    const body = (await req.json()) as Record<string, unknown>;
    const payload = sanitizeProductPayload(body, true);

    let { data, error } = await db
      .from('products')
      .insert(payload)
      .select('*')
      .single();

    if (error && error.code === '42703') {
      const { slug: _s, gallery_images: _g, is_featured: _f, ...core } = payload;
      const fallback = await db
        .from('products')
        .insert(core)
        .select('*')
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      return jsonResponse(req, 400, {
        error: error?.message || 'Failed to add product.',
      });
    }
    return jsonResponse(req, 201, { product: data });
  }

  if (req.method === 'PUT') {
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!isValidUuid(id)) {
      return jsonResponse(req, 400, { error: 'Valid product ID is required.' });
    }

    const payload = sanitizeProductPayload(body, false);
    let { data, error } = await db
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error && error.code === '42703') {
      const { slug: _s, gallery_images: _g, is_featured: _f, ...core } = payload;
      const fallback = await db
        .from('products')
        .update(core)
        .eq('id', id)
        .select('*')
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      return jsonResponse(req, 400, {
        error: error?.message || 'Failed to update product.',
      });
    }
    return jsonResponse(req, 200, { product: data });
  }

  if (req.method === 'DELETE') {
    let id = url.searchParams.get('id')?.trim() ?? '';
    if (!id) {
      const body = (await req.json().catch(() => ({}))) as { id?: unknown };
      id = typeof body.id === 'string' ? body.id.trim() : '';
    }
    if (!isValidUuid(id)) {
      return jsonResponse(req, 400, { error: 'Valid product ID is required.' });
    }

    const { error } = await db.from('products').delete().eq('id', id);
    if (error) {
      return jsonResponse(req, 400, { error: error.message });
    }
    return jsonResponse(req, 200, { deleted: true });
  }

  return jsonResponse(req, 405, { error: 'Method not allowed.' });
}

async function handleOrders(req: Request, db: SupabaseClient): Promise<Response> {
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('orders')
      .select(
        `
        id,
        order_number,
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
        order_status,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      return jsonResponse(req, 500, { error: error.message });
    }
    return jsonResponse(req, 200, { orders: data ?? [] });
  }

  if (req.method === 'PATCH') {
    const body = (await req.json()) as { orderId?: unknown; status?: unknown };
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const status = typeof body.status === 'string' ? body.status.trim() : '';

    if (!isValidUuid(orderId)) {
      return jsonResponse(req, 400, { error: 'Valid order ID is required.' });
    }
    if (!VALID_ORDER_STATUSES.has(status)) {
      return jsonResponse(req, 400, { error: 'Invalid order status.' });
    }

    const { error } = await db
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);

    if (error) {
      return jsonResponse(req, 400, { error: error.message });
    }
    return jsonResponse(req, 200, { updated: true });
  }

  return jsonResponse(req, 405, { error: 'Method not allowed.' });
}

async function handleSettings(
  req: Request,
  db: SupabaseClient
): Promise<Response> {
  if (req.method !== 'PUT') {
    return jsonResponse(req, 405, { error: 'Method not allowed.' });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const deliveryCharges = Math.max(0, Number(body.delivery_charges ?? 250));
  if (!Number.isFinite(deliveryCharges)) {
    return jsonResponse(req, 400, {
      error: 'Delivery charges must be a valid non-negative number.',
    });
  }

  const corePayload = {
    store_name:
      typeof body.store_name === 'string' && body.store_name.trim()
        ? body.store_name.trim()
        : 'I.A FRAGRANCE',
    logo_url: typeof body.logo_url === 'string' ? body.logo_url.trim() : '',
    whatsapp_number:
      typeof body.whatsapp_number === 'string' ? body.whatsapp_number.trim() : '',
    contact_email:
      typeof body.contact_email === 'string' ? body.contact_email.trim() : '',
    instagram_url:
      typeof body.instagram_url === 'string' ? body.instagram_url.trim() : '',
    facebook_url:
      typeof body.facebook_url === 'string' ? body.facebook_url.trim() : '',
    tiktok_url:
      typeof body.tiktok_url === 'string' ? body.tiktok_url.trim() : '',
    atelier_city:
      typeof body.atelier_city === 'string' ? body.atelier_city.trim() : '',
    concierge_hours:
      typeof body.concierge_hours === 'string'
        ? body.concierge_hours.trim()
        : '',
    delivery_charges: deliveryCharges,
    announcement_text:
      typeof body.announcement_text === 'string'
        ? body.announcement_text.trim()
        : '',
    hero_heading:
      typeof body.hero_heading === 'string' ? body.hero_heading.trim() : '',
    hero_subheading:
      typeof body.hero_subheading === 'string'
        ? body.hero_subheading.trim()
        : '',
  };

  const extendedPayload = {
    ...corePayload,
    promo_banner_title:
      typeof body.promo_banner_title === 'string'
        ? body.promo_banner_title.trim()
        : '',
    promo_banner_subtitle:
      typeof body.promo_banner_subtitle === 'string'
        ? body.promo_banner_subtitle.trim()
        : '',
    promo_banner_cta:
      typeof body.promo_banner_cta === 'string'
        ? body.promo_banner_cta.trim()
        : '',
    testimonials: Array.isArray(body.testimonials) ? body.testimonials : [],
  };

  let { data, error } = await db
    .from('store_settings')
    .update(extendedPayload)
    .eq('id', 1)
    .select('*')
    .single();

  if (error && error.code === '42703') {
    const fallback = await db
      .from('store_settings')
      .update(corePayload)
      .eq('id', 1)
      .select('*')
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return jsonResponse(req, 400, {
      error: error?.message || 'Failed to save store settings.',
    });
  }

  return jsonResponse(req, 200, { settings: data });
}

async function handleUpload(req: Request, db: SupabaseClient): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(req, 405, { error: 'Method not allowed.' });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const rawFolder = formData.get('folder');

  if (!(file instanceof File)) {
    return jsonResponse(req, 400, { error: 'No image file provided.' });
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return jsonResponse(req, 400, {
      error: 'Please upload a JPG, PNG, WebP, or AVIF image.',
    });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return jsonResponse(req, 400, {
      error: 'Image size must be 5 MB or smaller.',
    });
  }

  const safeFolder =
    typeof rawFolder === 'string' && rawFolder.trim()
      ? rawFolder.replace(/[^a-z0-9_-]/gi, '')
      : 'products';
  const ext =
    file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filePath = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from('product-images')
    .upload(filePath, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return jsonResponse(req, 400, { error: uploadError.message });
  }

  const { data } = db.storage.from('product-images').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    return jsonResponse(req, 500, {
      error: 'Uploaded image public URL could not be resolved.',
    });
  }

  return jsonResponse(req, 200, { publicUrl: data.publicUrl });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: buildCorsHeaders(req) });
  }

  try {
    const db = getServiceClient();
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? '';

    if (req.method !== 'GET' && !isMutationCsrfSafe(req)) {
      return jsonResponse(req, 403, { error: 'Forbidden origin.' });
    }

    if (action === 'products') {
      return await handleProducts(req, db, url);
    }
    if (action === 'orders') {
      return await handleOrders(req, db);
    }
    if (action === 'settings') {
      return await handleSettings(req, db);
    }
    if (action === 'upload') {
      return await handleUpload(req, db);
    }

    return jsonResponse(req, 404, { error: 'Unknown admin endpoint.' });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unexpected server error.';
    return jsonResponse(req, 500, { error: message });
  }
});
