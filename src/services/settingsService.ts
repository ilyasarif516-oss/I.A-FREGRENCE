import {
  DEFAULT_TESTIMONIALS,
  INITIAL_CONTACT_SETTINGS,
} from '../data/defaults';
import { callAdminApi } from '../lib/adminApi';
import { supabase } from '../lib/supabase';
import { ContactSettings, TestimonialItem } from '../types/store';

interface StoreSettingsRow {
  id: number;
  store_name: string;
  logo_url: string;
  whatsapp_number: string;
  contact_email: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  atelier_city: string;
  concierge_hours: string;
  delivery_charges: number | string;
  announcement_text: string;
  hero_heading?: string;
  hero_subheading?: string;
  promo_banner_title?: string;
  promo_banner_subtitle?: string;
  promo_banner_cta?: string;
  testimonials?: unknown;
}

function normalizeTestimonials(raw: unknown): TestimonialItem[] {
  if (!Array.isArray(raw)) return DEFAULT_TESTIMONIALS;
  const parsed = raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `t-${idx + 1}`,
      name: typeof item.name === 'string' ? item.name : '',
      location: typeof item.location === 'string' ? item.location : '',
      productPurchased:
        typeof item.productPurchased === 'string' ? item.productPurchased : '',
      quote: typeof item.quote === 'string' ? item.quote : '',
      rating:
        typeof item.rating === 'number'
          ? Math.min(5, Math.max(1, Math.round(item.rating)))
          : 5,
    }))
    .filter((t) => t.name.trim() && t.quote.trim());

  return parsed.length > 0 ? parsed : DEFAULT_TESTIMONIALS;
}

function mapRowToSettings(row: StoreSettingsRow): ContactSettings {
  return {
    storeName: row.store_name || INITIAL_CONTACT_SETTINGS.storeName,
    logoUrl: row.logo_url ?? '',
    whatsappNumber: row.whatsapp_number ?? '',
    email: row.contact_email ?? '',
    instagramUrl: row.instagram_url ?? '',
    facebookUrl: row.facebook_url ?? '',
    tiktokUrl: row.tiktok_url ?? '',
    atelierCity: row.atelier_city ?? INITIAL_CONTACT_SETTINGS.atelierCity,
    conciergeHours: row.concierge_hours ?? INITIAL_CONTACT_SETTINGS.conciergeHours,
    deliveryCharges: Number(row.delivery_charges ?? 250),
    announcementText:
      row.announcement_text ?? INITIAL_CONTACT_SETTINGS.announcementText,
    heroHeading:
      row.hero_heading ?? INITIAL_CONTACT_SETTINGS.heroHeading,
    heroSubheading:
      row.hero_subheading ?? INITIAL_CONTACT_SETTINGS.heroSubheading,
    promoBannerTitle:
      row.promo_banner_title ?? INITIAL_CONTACT_SETTINGS.promoBannerTitle,
    promoBannerSubtitle:
      row.promo_banner_subtitle ?? INITIAL_CONTACT_SETTINGS.promoBannerSubtitle,
    promoBannerCta:
      row.promo_banner_cta ?? INITIAL_CONTACT_SETTINGS.promoBannerCta,
    testimonials: normalizeTestimonials(row.testimonials),
  };
}

export async function fetchStoreSettingsFromSupabase(): Promise<ContactSettings> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return INITIAL_CONTACT_SETTINGS;
  }

  return mapRowToSettings(data as StoreSettingsRow);
}

export async function updateStoreSettingsInSupabase(
  settings: ContactSettings
): Promise<ContactSettings> {
  const payload = {
    store_name: settings.storeName.trim() || 'I.A FRAGRANCE',
    logo_url: settings.logoUrl.trim(),
    whatsapp_number: settings.whatsappNumber.trim(),
    contact_email: settings.email.trim(),
    instagram_url: settings.instagramUrl.trim(),
    facebook_url: settings.facebookUrl.trim(),
    tiktok_url: settings.tiktokUrl.trim(),
    atelier_city: settings.atelierCity.trim(),
    concierge_hours: settings.conciergeHours.trim(),
    delivery_charges: Math.max(0, Number(settings.deliveryCharges) || 0),
    announcement_text: settings.announcementText.trim(),
    hero_heading: settings.heroHeading.trim() || INITIAL_CONTACT_SETTINGS.heroHeading,
    hero_subheading:
      settings.heroSubheading.trim() || INITIAL_CONTACT_SETTINGS.heroSubheading,
    promo_banner_title:
      settings.promoBannerTitle.trim() ||
      INITIAL_CONTACT_SETTINGS.promoBannerTitle,
    promo_banner_subtitle:
      settings.promoBannerSubtitle.trim() ||
      INITIAL_CONTACT_SETTINGS.promoBannerSubtitle,
    promo_banner_cta:
      settings.promoBannerCta.trim() || INITIAL_CONTACT_SETTINGS.promoBannerCta,
    testimonials: settings.testimonials,
  };

  const { settings: saved } = await callAdminApi<{ settings: StoreSettingsRow }>(
    'settings',
    {
      method: 'PUT',
      body: payload,
    }
  );

  return mapRowToSettings(saved);
}
