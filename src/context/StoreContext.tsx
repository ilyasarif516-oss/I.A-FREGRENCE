import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_BLACK_WANTED_IMAGE,
  DEFAULT_PINK_LATTAFA_IMAGE,
  INITIAL_CONTACT_SETTINGS,
  INITIAL_PRODUCTS,
} from '../data/defaults';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchAdminOrdersFromSupabase,
  submitGuestOrderToSupabase,
  updateOrderStatusInSupabase,
} from '../services/ordersService';
import {
  createProductInSupabase,
  deleteProductInSupabase,
  fetchAdminProductsFromSupabase,
  fetchProductsFromSupabase,
  updateProductInSupabase,
  uploadImageToStorage,
} from '../services/productsService';
import {
  fetchStoreSettingsFromSupabase,
  updateStoreSettingsInSupabase,
} from '../services/settingsService';
import { PaymentMethodId } from '../types/payment';
import {
  AdminSection,
  CartItem,
  ContactSettings,
  OrderRecord,
  OrderStatus,
  Product,
} from '../types/store';
import { compressImageFile, slugifyProductName } from '../utils/format';

const STORAGE_KEYS = {
  products: 'ia_fragrance_products_v2',
  contact: 'ia_fragrance_contact_v2',
  cart: 'ia_fragrance_cart_v2',
  orders: 'ia_fragrance_orders_v2',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseRouteState(): { isAdmin: boolean; productSlug: string | null } {
  if (typeof window === 'undefined') {
    return { isAdmin: false, productSlug: null };
  }
  const path = window.location.pathname;
  const hash = window.location.hash;

  if (path.startsWith('/admin') || hash.startsWith('#/admin')) {
    return { isAdmin: true, productSlug: null };
  }

  const productMatch = path.match(/^\/products\/([^/]+)\/?$/);
  if (productMatch?.[1]) {
    return { isAdmin: false, productSlug: decodeURIComponent(productMatch[1]) };
  }

  return { isAdmin: false, productSlug: null };
}

interface OrderSubmissionInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  orderNotes: string;
  paymentMethod: PaymentMethodId;
}

export interface NewProductInput {
  name: string;
  price: number;
  imageUrl: string;
  galleryImages?: string[];
  edition: string;
  volume: string;
  description: string;
  notes: { top: string; heart: string; base: string };
  stock: number;
  isFeatured?: boolean;
  isActive: boolean;
}

interface StoreContextValue {
  isAdminRoute: boolean;
  activeProductSlug: string | null;
  activePageProduct: Product | null;
  activeAdminSection: AdminSection;
  setActiveAdminSection: (section: AdminSection) => void;
  openAdmin: (section?: AdminSection) => void;
  navigateToStorefront: (sectionHash?: string) => void;
  openProductPage: (product: Product) => void;
  closeProductPage: (sectionHash?: string) => void;
  products: Product[];
  pinkLattafa: Product;
  secondProduct: Product;
  contactSettings: ContactSettings;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  orders: OrderRecord[];
  isLoadingStore: boolean;
  storeError: string | null;
  isSupabaseConnected: boolean;
  isOrdersLoading: boolean;
  isCartOpen: boolean;
  selectedProduct: Product | null;
  toastMessage: string | null;
  setIsCartOpen: (open: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;
  retryLoadStore: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  changeOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getProductStock: (productId: string) => number;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  uploadAssetImage: (file: File, folder: string) => Promise<string>;
  createProduct: (input: NewProductInput) => Promise<Product>;
  updateProductById: (
    productId: string,
    updates: Partial<Product>
  ) => Promise<Product>;
  deleteProductById: (productId: string) => Promise<void>;
  updateContactSettings: (updates: Partial<ContactSettings>) => Promise<void>;
  placeOrder: (orderInput: OrderSubmissionInput) => Promise<OrderRecord>;
  resetStoreDefaults: () => Promise<void>;
  showToast: (message: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialRoute = useMemo(parseRouteState, []);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(initialRoute.isAdmin);
  const [activeProductSlug, setActiveProductSlug] = useState<string | null>(
    initialRoute.productSlug
  );
  const [activeAdminSection, setActiveAdminSection] =
    useState<AdminSection>('overview');

  const [products, setProducts] = useState<Product[]>(() => {
    if (isSupabaseConfigured) return INITIAL_PRODUCTS;
    const stored = loadFromStorage<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    if (!Array.isArray(stored) || stored.length === 0) return INITIAL_PRODUCTS;
    const legacyPlaceholders = new Set([
      '/src/assets/images/pink_lattafa_bottle_1795208908287.jpg',
      '/src/assets/images/about_atelier_craft_1795208908171.jpg',
      '/src/assets/images/packaging_unboxing_1795208908244.jpg',
      '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM_bc8d9edf.jpeg',
      '/assets/aistudio/WhatsApp_Image_2026-11-21_at_1.43.45_AM__1__3fefab0d.jpeg',
    ]);

    return stored.map((item) => {
      if (
        item.slot === 2 &&
        !item.name.trim() &&
        !item.imageUrl.trim() &&
        item.price === null &&
        !item.isActive
      ) {
        return INITIAL_PRODUCTS[1];
      }

      const isLegacyPrimary =
        !item.imageUrl.trim() || legacyPlaceholders.has(item.imageUrl.trim());
      const upgradedImageUrl =
        item.slot === 1 && isLegacyPrimary
          ? DEFAULT_PINK_LATTAFA_IMAGE
          : item.slot === 2 && isLegacyPrimary
            ? DEFAULT_BLACK_WANTED_IMAGE
            : item.imageUrl;

      const baseGallery = Array.isArray(item.galleryImages)
        ? item.galleryImages.filter(
            (img) =>
              typeof img === 'string' &&
              img.trim().length > 0 &&
              !legacyPlaceholders.has(img.trim())
          )
        : upgradedImageUrl
          ? [upgradedImageUrl]
          : [];

      const mergedGallery = upgradedImageUrl
        ? Array.from(new Set([upgradedImageUrl, ...baseGallery].filter(Boolean)))
        : baseGallery;

      return {
        ...item,
        imageUrl: upgradedImageUrl,
        volume:
          item.slot === 1 && (!item.volume || item.volume === '100 ml')
            ? '50 ml'
            : item.volume,
        slug: item.slug || slugifyProductName(item.name || item.id, item.id),
        galleryImages: mergedGallery,
        isFeatured:
          item.isFeatured !== undefined
            ? item.isFeatured
            : item.slot === 1 || item.slot === 2,
      };
    });
  });

  const [contactSettings, setContactSettings] = useState<ContactSettings>(() => {
    if (isSupabaseConfigured) return INITIAL_CONTACT_SETTINGS;
    return {
      ...INITIAL_CONTACT_SETTINGS,
      ...loadFromStorage<Partial<ContactSettings>>(
        STORAGE_KEYS.contact,
        INITIAL_CONTACT_SETTINGS
      ),
    };
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = loadFromStorage<CartItem[]>(STORAGE_KEYS.cart, []);
    return Array.isArray(stored) ? stored : [];
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    return loadFromStorage<OrderRecord[]>(STORAGE_KEYS.orders, []);
  });

  const [isLoadingStore, setIsLoadingStore] = useState<boolean>(isSupabaseConfigured);
  const [storeError, setStoreError] = useState<string | null>(null);

  const [isOrdersLoading, setIsOrdersLoading] = useState<boolean>(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasFetchedStoreRef = useRef<boolean>(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  // Browser URL routing sync (/admin, /products/:slug, /)
  useEffect(() => {
    const handlePopState = () => {
      const next = parseRouteState();
      setIsAdminRoute(next.isAdmin);
      setActiveProductSlug(next.productSlug);
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const openAdmin = useCallback((section: AdminSection = 'overview') => {
    setActiveAdminSection(section);
    setIsAdminRoute(true);
    setActiveProductSlug(null);
    setIsCartOpen(false);
    setSelectedProduct(null);
    if (!window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/admin');
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const navigateToStorefront = useCallback((sectionHash?: string) => {
    setIsAdminRoute(false);
    setActiveProductSlug(null);
    const targetUrl = sectionHash ? `/${sectionHash}` : '/';
    window.history.pushState({}, '', targetUrl);
    if (sectionHash) {
      window.requestAnimationFrame(() => {
        const el = document.querySelector(sectionHash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openProductPage = useCallback((product: Product) => {
    const slug = product.slug || slugifyProductName(product.name, product.id);
    setIsAdminRoute(false);
    setSelectedProduct(null);
    setActiveProductSlug(slug);
    const targetUrl = `/products/${encodeURIComponent(slug)}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeProductPage = useCallback(
    (sectionHash?: string) => {
      navigateToStorefront(sectionHash);
    },
    [navigateToStorefront]
  );

  // Reconcile persisted cart items against authoritative product catalog
  const reconcileCartWithProducts = useCallback((catalog: Product[]) => {
    setCart((prevCart) => {
      if (prevCart.length === 0) return prevCart;
      let changed = false;
      const nextCart: CartItem[] = [];

      for (const item of prevCart) {
        const match = catalog.find((p) => p.id === item.productId);
        if (
          !match ||
          !match.isConfigured ||
          !match.inStock ||
          match.stock <= 0 ||
          match.price === null
        ) {
          changed = true;
          continue;
        }
        const clampedQty = Math.min(Math.max(1, item.quantity), match.stock);
        if (
          clampedQty !== item.quantity ||
          item.price !== match.price ||
          item.name !== match.name ||
          item.imageUrl !== match.imageUrl
        ) {
          changed = true;
        }
        nextCart.push({
          ...item,
          name: match.name,
          price: match.price,
          imageUrl: match.imageUrl,
          volume: match.volume || 'Eau de Parfum',
          quantity: clampedQty,
        });
      }

      return changed ? nextCart : prevCart;
    });
  }, []);

  const loadSupabaseStoreData = useCallback(
    async (asAdmin = false) => {
      if (!isSupabaseConfigured) {
        setIsLoadingStore(false);
        setStoreError(null);
        return;
      }

      try {
        setIsLoadingStore(true);
        setStoreError(null);
        const [fetchedProducts, fetchedSettings] = await Promise.all([
          asAdmin ? fetchAdminProductsFromSupabase() : fetchProductsFromSupabase(),
          fetchStoreSettingsFromSupabase(),
        ]);
        hasFetchedStoreRef.current = true;
        setProducts(fetchedProducts);
        reconcileCartWithProducts(fetchedProducts);
        setContactSettings(fetchedSettings);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load storefront catalog from Supabase.';
        setStoreError(message);
      } finally {
        setIsLoadingStore(false);
      }
    },
    [reconcileCartWithProducts]
  );

  const refreshOrders = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      setIsOrdersLoading(true);
      const fetchedOrders = await fetchAdminOrdersFromSupabase();
      setOrders(fetchedOrders);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not fetch customer orders.';
      showToast(message);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!hasFetchedStoreRef.current) {
      loadSupabaseStoreData(isAdminRoute);
    }
  }, [isAdminRoute, loadSupabaseStoreData]);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAdminRoute) return;
    loadSupabaseStoreData(true);
    refreshOrders();
  }, [isAdminRoute, loadSupabaseStoreData, refreshOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    try {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.contact, JSON.stringify(contactSettings));
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors
    }
  }, [products, contactSettings, orders]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const getProductStock = useCallback(
    (productId: string): number => {
      const found = products.find((p) => p.id === productId);
      return found ? Math.max(0, found.stock) : 0;
    },
    [products]
  );

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (
        !product.isConfigured ||
        !product.isActive ||
        !product.inStock ||
        product.stock <= 0 ||
        product.price === null
      ) {
        showToast(`${product.name || 'This fragrance'} is currently out of stock.`);
        return;
      }

      const validPrice = product.price;
      const existingItem = cart.find((item) => item.productId === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const desiredQty = currentQty + Math.max(1, quantity);

      if (currentQty >= product.stock) {
        showToast(
          `Maximum available stock (${product.stock}) for ${product.name} is already in your cart.`
        );
        setIsCartOpen(true);
        return;
      }

      const finalQty = Math.min(desiredQty, product.stock);
      const wasClamped = desiredQty > product.stock;

      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id);
        if (existing) {
          return prev.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: finalQty, price: validPrice }
              : item
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: validPrice,
            imageUrl: product.imageUrl,
            volume: product.volume || 'Eau de Parfum',
            quantity: finalQty,
          },
        ];
      });

      setIsCartOpen(true);
      if (wasClamped) {
        showToast(
          `Added maximum available stock (${product.stock}) for ${product.name}.`
        );
      } else {
        showToast(`${product.name} added to your cart.`);
      }
    },
    [cart, showToast]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
        return;
      }

      const match = products.find((p) => p.id === productId);
      if (!match || !match.inStock || match.stock <= 0) {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
        showToast('This item is no longer available and was removed.');
        return;
      }

      if (quantity > match.stock) {
        showToast(`Only ${match.stock} unit(s) of ${match.name} available in stock.`);
      }

      const clamped = Math.min(quantity, match.stock);
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: clamped } : item
        )
      );
    },
    [products, showToast]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const uploadAssetImage = async (file: File, folder: string): Promise<string> => {
    if (isSupabaseConfigured) {
      return uploadImageToStorage(file, folder);
    }
    return compressImageFile(file, 960);
  };

  const createProduct = async (input: NewProductInput): Promise<Product> => {
    const nextSlot = products.reduce((max, p) => Math.max(max, p.slot), 0) + 1;
    const baseSlug = slugifyProductName(input.name);
    const hasCollision = products.some((p) => p.slug === baseSlug);
    const uniqueSlug = hasCollision ? `${baseSlug}-${nextSlot}` : baseSlug;
    const gallery = Array.from(
      new Set([input.imageUrl.trim(), ...(input.galleryImages ?? [])].filter(Boolean))
    );

    const draft: Omit<Product, 'id'> = {
      slot: nextSlot,
      slug: uniqueSlug,
      name: input.name.trim(),
      price: Math.round(input.price),
      currency: 'PKR',
      imageUrl: input.imageUrl.trim(),
      galleryImages: gallery,
      edition: input.edition.trim() || 'Eau de Parfum',
      volume: input.volume.trim() || '100 ml',
      description: input.description.trim(),
      notes: input.notes,
      stock: Math.max(0, Math.round(input.stock)),
      isFeatured: Boolean(input.isFeatured),
      isActive: input.isActive,
      inStock: input.isActive && input.stock > 0,
      isConfigured: input.isActive && input.price > 0,
    };

    if (isSupabaseConfigured) {
      const created = await createProductInSupabase(draft);
      const nextProducts = [...products, created];
      setProducts(nextProducts);
      reconcileCartWithProducts(nextProducts);
      return created;
    }

    const localCreated: Product = {
      ...draft,
      id: `product-${crypto.randomUUID()}`,
    };
    const nextProducts = [...products, localCreated];
    setProducts(nextProducts);
    reconcileCartWithProducts(nextProducts);
    return localCreated;
  };

  const updateProductById = async (
    productId: string,
    updates: Partial<Product>
  ): Promise<Product> => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) {
      throw new Error('Product not found.');
    }

    const nextStock =
      updates.stock !== undefined
        ? Math.max(0, Math.round(updates.stock))
        : existing.stock;

    const nextActive =
      updates.isActive !== undefined ? updates.isActive : existing.isActive;

    const nextPrice =
      updates.price !== undefined ? updates.price : existing.price;

    const nextName =
      updates.name !== undefined ? updates.name : existing.name;

    const nextImageUrl =
      updates.imageUrl !== undefined ? updates.imageUrl : existing.imageUrl;

    const rawGallery =
      updates.galleryImages !== undefined
        ? updates.galleryImages
        : existing.galleryImages;

    const nextGallery = Array.from(
      new Set([nextImageUrl.trim(), ...rawGallery.map((g) => g.trim())].filter(Boolean))
    );

    const nextSlug =
      updates.slug?.trim() ||
      (updates.name && updates.name.trim()
        ? slugifyProductName(updates.name, existing.slug || existing.id)
        : existing.slug || slugifyProductName(nextName, existing.id));

    const merged: Product = {
      ...existing,
      ...updates,
      slug: nextSlug,
      imageUrl: nextImageUrl,
      galleryImages: nextGallery,
      notes: {
        ...existing.notes,
        ...(updates.notes ?? {}),
      },
      stock: nextStock,
      isActive: nextActive,
      inStock: nextActive && nextStock > 0,
      isConfigured:
        nextActive && Boolean(nextName.trim()) && nextPrice !== null && nextPrice > 0,
    };

    if (isSupabaseConfigured) {
      const saved = await updateProductInSupabase(merged);
      const nextProducts = products.map((item) =>
        item.id === productId ? saved : item
      );
      setProducts(nextProducts);
      reconcileCartWithProducts(nextProducts);
      return saved;
    }

    const nextProducts = products.map((item) =>
      item.id === productId ? merged : item
    );
    setProducts(nextProducts);
    reconcileCartWithProducts(nextProducts);
    return merged;
  };

  const deleteProductById = async (productId: string): Promise<void> => {
    if (isSupabaseConfigured) {
      await deleteProductInSupabase(productId);
    }
    const nextProducts = products.filter((p) => p.id !== productId);
    setProducts(nextProducts);
    reconcileCartWithProducts(nextProducts);
    showToast('Product deleted.');
  };

  const updateContactSettings = async (updates: Partial<ContactSettings>) => {
    const merged: ContactSettings = { ...contactSettings, ...updates };
    if (isSupabaseConfigured) {
      const saved = await updateStoreSettingsInSupabase(merged);
      setContactSettings(saved);
      return;
    }
    setContactSettings(merged);
  };

  const placeOrder = async (
    orderInput: OrderSubmissionInput
  ): Promise<OrderRecord> => {
    if (cart.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (isSupabaseConfigured) {
      const created = await submitGuestOrderToSupabase({
        ...orderInput,
        items: cart,
      });
      setCart([]);
      await loadSupabaseStoreData(isAdminRoute);
      if (isAdminRoute) {
        await refreshOrders();
      }
      return created;
    }

    const authoritativeItems = cart.map((cartItem) => {
      const catalogItem = products.find((p) => p.id === cartItem.productId);
      if (
        !catalogItem ||
        !catalogItem.isActive ||
        !catalogItem.inStock ||
        catalogItem.price === null
      ) {
        throw new Error(`${cartItem.name} is no longer available.`);
      }
      if (catalogItem.stock < cartItem.quantity) {
        throw new Error(
          `Only ${catalogItem.stock} unit(s) of ${catalogItem.name} available in stock.`
        );
      }
      return {
        productId: catalogItem.id,
        productName: catalogItem.name,
        quantity: cartItem.quantity,
        unitPrice: catalogItem.price,
        totalPrice: catalogItem.price * cartItem.quantity,
      };
    });

    const subtotal = authoritativeItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const shippingFee =
      subtotal >= 4000 || subtotal === 0 ? 0 : contactSettings.deliveryCharges;
    const total = subtotal + shippingFee;
    const orderCode = `IA-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: OrderRecord = {
      id: crypto.randomUUID(),
      orderNumber: orderCode,
      customerName: orderInput.customerName.trim(),
      customerPhone: orderInput.customerPhone.trim(),
      customerEmail: orderInput.customerEmail.trim(),
      shippingAddress: orderInput.shippingAddress.trim(),
      city: orderInput.city.trim(),
      orderNotes: orderInput.orderNotes.trim(),
      items: authoritativeItems,
      subtotal,
      shippingFee,
      total,
      paymentMethod: orderInput.paymentMethod,
      orderStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) =>
      prev.map((product) => {
        const bought = authoritativeItems.find((i) => i.productId === product.id);
        if (!bought) return product;
        const nextStock = Math.max(0, product.stock - bought.quantity);
        return {
          ...product,
          stock: nextStock,
          inStock: product.isActive && nextStock > 0,
        };
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    return newOrder;
  };

  const changeOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (isSupabaseConfigured) {
      await updateOrderStatusInSupabase(orderId, status);
    }
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, orderStatus: status } : order
      )
    );
    showToast(`Order status updated to ${status}.`);
  };

  const resetStoreDefaults = async () => {
    if (!isSupabaseConfigured) {
      setProducts(INITIAL_PRODUCTS);
      setContactSettings(INITIAL_CONTACT_SETTINGS);
      setCart([]);
      showToast('Store settings restored to initial defaults.');
      return;
    }
    await updateContactSettings(INITIAL_CONTACT_SETTINGS);
    showToast('Store settings restored to defaults.');
  };

  const activePageProduct = useMemo(() => {
    if (!activeProductSlug) return null;
    return (
      products.find(
        (p) =>
          p.isActive &&
          Boolean(p.name.trim()) &&
          (p.slug === activeProductSlug || p.id === activeProductSlug)
      ) ?? null
    );
  }, [activeProductSlug, products]);

  const pinkLattafa = useMemo(
    () => products.find((p) => p.slot === 1) ?? products[0] ?? INITIAL_PRODUCTS[0],
    [products]
  );
  const secondProduct = useMemo(
    () => products.find((p) => p.slot === 2) ?? INITIAL_PRODUCTS[1],
    [products]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const cartDeliveryFee =
    cartSubtotal >= 4000 || cartSubtotal === 0 ? 0 : contactSettings.deliveryCharges;
  const cartTotal = cartSubtotal + cartDeliveryFee;

  return (
    <StoreContext.Provider
      value={{
        isAdminRoute,
        activeProductSlug,
        activePageProduct,
        activeAdminSection,
        setActiveAdminSection,
        openAdmin,
        navigateToStorefront,
        openProductPage,
        closeProductPage,
        products,
        pinkLattafa,
        secondProduct,
        contactSettings,
        cart,
        cartCount,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,
        orders,
        isLoadingStore,
        storeError,
        isSupabaseConnected: isSupabaseConfigured,
        isOrdersLoading,
        isCartOpen,
        selectedProduct,
        toastMessage,
        setIsCartOpen,
        setSelectedProduct,
        retryLoadStore: () => loadSupabaseStoreData(isAdminRoute),
        refreshOrders,
        changeOrderStatus,
        getProductStock,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        uploadAssetImage,
        createProduct,
        updateProductById,
        deleteProductById,
        updateContactSettings,
        placeOrder,
        resetStoreDefaults,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside a StoreProvider');
  }
  return ctx;
}
