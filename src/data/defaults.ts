import { ContactSettings, Product, TestimonialItem } from '../types/store';

export const DEFAULT_PINK_LATTAFA_IMAGE =
  '/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM_f2938b53.jpeg';
export const DEFAULT_BLACK_WANTED_IMAGE =
  '/assets/aistudio/WhatsApp_Image_2026-11-21_at_3.02.19_AM__1__24c2de60.jpeg';

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    name: 'Ayesha Siddiqui',
    location: 'Lahore',
    productPurchased: 'Pink Lattafa',
    quote:
      'The bottle arrived sealed in the soft-pink gift box and the creamy vanilla-orchid trail stayed on my shawl well into the next afternoon.',
    rating: 5,
  },
  {
    id: 't-2',
    name: 'Zainab Tariq',
    location: 'Karachi',
    productPurchased: 'Pink Lattafa',
    quote:
      'Ordering via Cash on Delivery took under a minute, and WhatsApp concierge confirmed dispatch the very same afternoon. Truly refined presentation.',
    rating: 5,
  },
  {
    id: 't-3',
    name: 'Hamza Raza',
    location: 'Islamabad',
    productPurchased: 'Black Wanted',
    quote:
      'Ordered both Pink Lattafa and Black Wanted. The heavy faceted flacons and lasting sillage feel like an international luxury house.',
    rating: 5,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'product-pink-lattafa',
    slot: 1,
    slug: 'pink-lattafa',
    name: 'Pink Lattafa',
    price: 2199,
    currency: 'PKR',
    imageUrl: DEFAULT_PINK_LATTAFA_IMAGE,
    galleryImages: [DEFAULT_PINK_LATTAFA_IMAGE],
    edition: 'Signature Eau de Parfum',
    volume: '50 ml',
    description:
      'A velvety gourmand-floral signature opening with radiant orchid and heliotrope, resting over creamy sandalwood, vanilla bean, and warm white musk.',
    notes: {
      top: 'Orchid, Heliotrope, Mandarin',
      heart: 'Gourmand Accord, Tropical Blossoms',
      base: 'Vanilla, Sandalwood, White Musk',
    },
    stock: 25,
    isFeatured: true,
    isConfigured: true,
    inStock: true,
    isActive: true,
  },
  {
    id: 'product-slot-2',
    slot: 2,
    slug: 'black-wanted',
    name: 'Black Wanted',
    price: 2199,
    currency: 'PKR',
    imageUrl: DEFAULT_BLACK_WANTED_IMAGE,
    galleryImages: [DEFAULT_BLACK_WANTED_IMAGE],
    edition: 'Signature Eau de Parfum',
    volume: '50 ml',
    description:
      'A bold obsidian aromatic signature opening with crisp cardamom and dark bergamot, anchored by smoked cedarwood, ambergris, and velvety black musk.',
    notes: {
      top: 'Cardamom, Dark Bergamot, Pink Pepper',
      heart: 'Smoked Cedarwood, Vetiver, Lavender',
      base: 'Ambergris, Black Musk, Tonka Bean',
    },
    stock: 25,
    isFeatured: true,
    isConfigured: true,
    inStock: true,
    isActive: true,
  },
];

export const INITIAL_CONTACT_SETTINGS: ContactSettings = {
  storeName: 'I.A FRAGRANCE',
  logoUrl: '',
  whatsappNumber: '+92 300 0000000',
  email: 'concierge@iafragrance.com',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://tiktok.com',
  atelierCity: 'Karachi · Lahore · Islamabad',
  conciergeHours: 'Daily, 10:00 AM – 9:00 PM PKT',
  deliveryCharges: 250,
  announcementText: 'Signature Edition · Pink Lattafa Eau de Parfum',
  heroHeading: 'YOUR FRAGRANCE, YOUR IDENTITY.',
  heroSubheading: 'Discover the art of unforgettable fragrance.',
  promoBannerTitle: 'Complimentary Nationwide Delivery',
  promoBannerSubtitle:
    'Enjoy free shipping across Pakistan on orders of PKR 4,000 or more, presented in our signature matte-black and blush packaging.',
  promoBannerCta: 'Explore Collection',
  testimonials: DEFAULT_TESTIMONIALS,
};
