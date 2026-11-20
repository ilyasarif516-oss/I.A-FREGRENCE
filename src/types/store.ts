import { PaymentMethodId } from './payment';

export interface FragranceNotes {
  top: string;
  heart: string;
  base: string;
}

export interface Product {
  id: string;
  slot: number;
  slug: string;
  name: string;
  price: number | null;
  currency: 'PKR';
  imageUrl: string;
  galleryImages: string[];
  edition: string;
  volume: string;
  description: string;
  notes: FragranceNotes;
  stock: number;
  isFeatured: boolean;
  isConfigured: boolean;
  inStock: boolean;
  isActive: boolean;
}

export interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  productPurchased: string;
  quote: string;
  rating: number;
}

export interface ContactSettings {
  storeName: string;
  logoUrl: string;
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  atelierCity: string;
  conciergeHours: string;
  deliveryCharges: number;
  announcementText: string;
  heroHeading: string;
  heroSubheading: string;
  promoBannerTitle: string;
  promoBannerSubtitle: string;
  promoBannerCta: string;
  testimonials: TestimonialItem[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  volume: string;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItemRecord {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  orderNotes: string;
  items: OrderItemRecord[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethodId | 'WhatsApp';
  orderStatus: OrderStatus;
  createdAt: string;
}

export type AdminSection = 'overview' | 'products' | 'orders' | 'settings';
