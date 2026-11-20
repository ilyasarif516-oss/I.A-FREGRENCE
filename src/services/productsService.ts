import {
  DEFAULT_BLACK_WANTED_IMAGE,
  DEFAULT_PINK_LATTAFA_IMAGE,
  INITIAL_PRODUCTS,
} from '../data/defaults';
import { callAdminApi } from '../lib/adminApi';
import { supabase } from '../lib/supabase';
import { FragranceNotes, Product } from '../types/store';
import { slugifyProductName } from '../utils/format';

const LEGACY_PLACEHOLDER_IMAGES = new Set([
  '/src/assets/images/pink_lattafa_bottle_1795208908287.jpg',
  '/src/assets/images/about_atelier_craft_1795208908171.jpg',
  '/src/assets/images/packaging_unboxing_1795208908244.jpg',
  '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM_bc8d9edf.jpeg',
  '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM__1__3fefab0d.jpeg',
]);

interface ProductRow {
  id: string;
  sort_order: number;
  slug?: string;
  name: string;
  description: string;
  price: number | string | null;
  image_url: string;
  gallery_images?: string[] | null;
  category: string;
  volume: string;
  notes: Partial<FragranceNotes> | null;
  stock: number;
  is_featured?: boolean;
  is_active: boolean;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function normalizeGallery(
  primaryImage: string,
  rawGallery: unknown
): string[] {
  const list = Array.isArray(rawGallery)
    ? rawGallery.filter(
        (item): item is string =>
          typeof item === 'string' &&
          item.trim().length > 0 &&
          !LEGACY_PLACEHOLDER_IMAGES.has(item.trim())
      )
    : [];

  const combined = primaryImage.trim()
    ? [primaryImage.trim(), ...list.filter((u) => u.trim() !== primaryImage.trim())]
    : list;

  return Array.from(new Set(combined));
}

function mapRowToProduct(row: ProductRow): Product {
  const slot = Number(row.sort_order ?? 99);
  const isUnconfiguredLegacySlot2 =
    slot === 2 &&
    !row.name?.trim() &&
    !row.image_url?.trim() &&
    (row.price === null || row.price === undefined) &&
    !row.is_active;

  if (isUnconfiguredLegacySlot2) {
    const blackWantedDefault = INITIAL_PRODUCTS[1];
    return {
      ...blackWantedDefault,
      id: row.id,
    };
  }

  const numericPrice =
    row.price === null || row.price === undefined ? null : Number(row.price);
  const stock = Number(row.stock ?? 0);
  const hasCoreDetails =
    Boolean(row.name?.trim()) && numericPrice !== null && numericPrice > 0;
  const rawImage = row.image_url ?? '';
  const isLegacyPrimary =
    !rawImage.trim() || LEGACY_PLACEHOLDER_IMAGES.has(rawImage.trim());
  const primaryImage =
    slot === 1 && isLegacyPrimary
      ? DEFAULT_PINK_LATTAFA_IMAGE
      : slot === 2 && isLegacyPrimary
        ? DEFAULT_BLACK_WANTED_IMAGE
        : rawImage;
  const slug =
    row.slug?.trim() ||
    slugifyProductName(row.name ?? '', slot === 2 ? 'black-wanted' : row.id);

  return {
    id: row.id,
    slot,
    slug,
    name: row.name ?? '',
    price: Number.isFinite(numericPrice) ? numericPrice : null,
    currency: 'PKR',
    imageUrl: primaryImage,
    galleryImages: normalizeGallery(primaryImage, row.gallery_images),
    edition: row.category ?? '',
    volume:
      slot === 1 && (!row.volume?.trim() || row.volume === '100 ml')
        ? '50 ml'
        : row.volume ?? '',
    description: row.description ?? '',
    notes: {
      top: row.notes?.top ?? '',
      heart: row.notes?.heart ?? '',
      base: row.notes?.base ?? '',
    },
    stock,
    isFeatured:
      row.is_featured !== undefined
        ? Boolean(row.is_featured)
        : slot === 1 || slot === 2,
    isActive: Boolean(row.is_active),
    isConfigured: slot === 1 ? true : Boolean(row.is_active) && hasCoreDetails,
    inStock: Boolean(row.is_active) && stock > 0,
  };
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const mapped = ((data ?? []) as ProductRow[]).map(mapRowToProduct);
  if (mapped.length === 0) {
    return INITIAL_PRODUCTS;
  }
  return mapped;
}

export async function fetchAdminProductsFromSupabase(): Promise<Product[]> {
  const { products } = await callAdminApi<{ products: ProductRow[] }>(
    'products',
    { method: 'GET' }
  );

  const mapped = (products ?? []).map(mapRowToProduct);
  if (mapped.length === 0) {
    return INITIAL_PRODUCTS;
  }
  return mapped;
}

export async function createProductInSupabase(
  product: Omit<Product, 'id'>
): Promise<Product> {
  const { product: created } = await callAdminApi<{ product: ProductRow }>(
    'products',
    {
      method: 'POST',
      body: {
        sort_order: product.slot,
        slug: product.slug || slugifyProductName(product.name),
        name: product.name.trim(),
        description: product.description.trim(),
        price: product.price,
        image_url: product.imageUrl.trim(),
        gallery_images: product.galleryImages,
        category: product.edition.trim(),
        volume: product.volume.trim(),
        notes: product.notes,
        stock: Math.max(0, Math.round(product.stock)),
        is_featured: product.isFeatured,
        is_active: product.isActive,
      },
    }
  );

  return mapRowToProduct(created);
}

export async function updateProductInSupabase(product: Product): Promise<Product> {
  const { product: updated } = await callAdminApi<{ product: ProductRow }>(
    'products',
    {
      method: 'PUT',
      body: {
        id: product.id,
        slug: product.slug || slugifyProductName(product.name, product.id),
        name: product.name.trim(),
        description: product.description.trim(),
        price: product.price,
        image_url: product.imageUrl.trim(),
        gallery_images: product.galleryImages,
        category: product.edition.trim(),
        volume: product.volume.trim(),
        notes: product.notes,
        stock: Math.max(0, Math.round(product.stock)),
        is_featured: product.isFeatured,
        is_active: product.isActive,
      },
    }
  );

  return mapRowToProduct(updated);
}

export async function deleteProductInSupabase(productId: string): Promise<void> {
  await callAdminApi<{ deleted: boolean }>('products', {
    method: 'DELETE',
    query: { id: productId },
    body: { id: productId },
  });
}

export async function uploadImageToStorage(
  file: File,
  folder: string
): Promise<string> {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Please upload a JPG, PNG, WebP, or AVIF image.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size must be 5 MB or smaller.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder.replace(/[^a-z0-9_-]/gi, '') || 'products');

  const { publicUrl } = await callAdminApi<{ publicUrl: string }>('upload', {
    method: 'POST',
    formData,
  });

  if (!publicUrl) {
    throw new Error('Uploaded image public URL could not be resolved.');
  }

  return publicUrl;
}
