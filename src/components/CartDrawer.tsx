import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { PAYMENT_METHODS, PaymentMethodId } from '../types/payment';
import { OrderRecord } from '../types/store';
import { buildWhatsAppUrl, formatPKR } from '../utils/format';
import { LuxuryImage } from './LuxuryImage';

export function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    contactSettings,
    isCartOpen,
    setIsCartOpen,
    getProductStock,
    updateCartQuantity,
    removeFromCart,
    placeOrder,
    showToast,
  } = useStore();

  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  useEffect(() => {
    if (cart.length > 0 && step === 'confirmed') {
      setStep('bag');
      setConfirmedOrder(null);
      setCopiedOrderNumber(false);
    }
  }, [cart.length, step]);

  const configuredDelivery = contactSettings.deliveryCharges ?? 250;

  const handleClose = () => {
    setIsCartOpen(false);
    setOrderError(null);
    if (step === 'confirmed') {
      window.setTimeout(() => {
        setStep('bag');
        setConfirmedOrder(null);
        setCopiedOrderNumber(false);
      }, 250);
    }
  };

  const validateCheckoutForm = (): string | null => {
    if (customerName.trim().length < 2) {
      return 'Please enter your full name (at least 2 characters).';
    }
    const digits = customerPhone.replace(/[^\d]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return 'Please enter a valid mobile number (10 to 15 digits).';
    }
    if (
      customerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
    ) {
      return 'Please enter a valid email address or leave it blank.';
    }
    if (city.trim().length < 2) {
      return 'Please enter your delivery city.';
    }
    if (shippingAddress.trim().length < 8) {
      return 'Please enter your complete delivery street address.';
    }
    return null;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    const validationError = validateCheckoutForm();
    if (validationError) {
      setOrderError(validationError);
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);
    try {
      const record = await placeOrder({
        customerName,
        customerPhone,
        customerEmail,
        city,
        shippingAddress,
        orderNotes,
        paymentMethod: selectedPayment,
      });
      setConfirmedOrder(record);
      setStep('confirmed');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCity('');
      setShippingAddress('');
      setOrderNotes('');
      showToast(`Order ${record.orderNumber} confirmed.`);
    } catch (err) {
      setOrderError(
        err instanceof Error
          ? err.message
          : 'Unable to place your order. Please verify your details and retry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderNumber = async (orderNum: string) => {
    try {
      await navigator.clipboard.writeText(orderNum);
      setCopiedOrderNumber(true);
      showToast(`Order number ${orderNum} copied.`);
      window.setTimeout(() => setCopiedOrderNumber(false), 2000);
    } catch {
      showToast(orderNum);
    }
  };

  const handleSendConfirmedOrderToWhatsApp = (order: OrderRecord) => {
    const lines = order.items.map(
      (item) =>
        `• ${item.productName} × ${item.quantity} (${formatPKR(item.unitPrice)}) = ${formatPKR(
          item.totalPrice
        )}`
    );
    const message = [
      `Order Confirmation: ${order.orderNumber}`,
      `Name: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `City: ${order.city}`,
      `Address: ${order.shippingAddress}`,
      `Payment: ${order.paymentMethod}`,
      '',
      ...lines,
      '',
      `Subtotal: ${formatPKR(order.subtotal)}`,
      `Delivery: ${
        order.shippingFee === 0 ? 'Complimentary' : formatPKR(order.shippingFee)
      }`,
      `Total: ${formatPKR(order.total)}`,
    ].join('\n');

    const url = buildWhatsAppUrl(contactSettings.whatsappNumber, message);
    if (url === '#contact') {
      showToast('WhatsApp concierge number is not configured.');
      return;
    }
    window.location.href = url;
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-5 border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step === 'checkout' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('bag');
                      setOrderError(null);
                    }}
                    aria-label="Back to shopping cart"
                    className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#0B0B0D]">
                    {step === 'bag' && 'Shopping Cart'}
                    {step === 'checkout' && 'Guest Checkout'}
                    {step === 'confirmed' && 'Order Confirmed'}
                  </h2>
                  {step === 'bag' && (
                    <p className="text-xs text-[#0B0B0D]/55 tabular-nums">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close shopping cart"
                className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-[#0B0B0D] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6">
              {step === 'confirmed' && confirmedOrder ? (
                <div className="py-2 space-y-6">
                  {/* Confirmation Hero */}
                  <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-black/10">
                    <div className="w-14 h-14 rounded-full bg-[#FDF5F8] border border-[#F4CBD8] flex items-center justify-center text-[#0B0B0D]">
                      <CheckCircle2 className="w-7 h-7" strokeWidth={1.6} />
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#0B0B0D]/60">
                      Order Successfully Placed
                    </p>
                    <h3 className="font-display text-3xl font-semibold text-[#0B0B0D]">
                      Thank You, {confirmedOrder.customerName}
                    </h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF8F9] border border-black/10">
                      <span className="text-xs text-[#0B0B0D]/60">Order #</span>
                      <span className="text-sm font-semibold text-[#0B0B0D] tabular-nums">
                        {confirmedOrder.orderNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyOrderNumber(confirmedOrder.orderNumber)
                        }
                        aria-label="Copy order number"
                        className="p-1 text-[#0B0B0D]/60 hover:text-[#0B0B0D] cursor-pointer"
                      >
                        {copiedOrderNumber ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Delivery & Payment Details */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F9] border border-black/10 space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55">Mobile</span>
                      <span className="font-medium text-[#0B0B0D] tabular-nums">
                        {confirmedOrder.customerPhone}
                      </span>
                    </div>
                    {confirmedOrder.customerEmail && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#0B0B0D]/55">Email</span>
                        <span className="font-medium text-[#0B0B0D]">
                          {confirmedOrder.customerEmail}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55">City</span>
                      <span className="font-medium text-[#0B0B0D]">
                        {confirmedOrder.city}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55 shrink-0">Address</span>
                      <span className="font-medium text-[#0B0B0D] text-right">
                        {confirmedOrder.shippingAddress}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#0B0B0D]/55">Payment Method</span>
                      <span className="font-medium text-[#0B0B0D]">
                        Cash on Delivery ({confirmedOrder.paymentMethod})
                      </span>
                    </div>
                    {confirmedOrder.orderNotes && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#0B0B0D]/55 shrink-0">Notes</span>
                        <span className="font-medium text-[#0B0B0D] text-right">
                          {confirmedOrder.orderNotes}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Summary */}
                  <div className="space-y-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#0B0B0D]/55">
                      Order Summary
                    </p>
                    {confirmedOrder.items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="flex items-start justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium text-[#0B0B0D]">
                            {item.productName}
                          </p>
                          <p className="text-xs text-[#0B0B0D]/55 tabular-nums">
                            {formatPKR(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium text-[#0B0B0D] tabular-nums">
                          {formatPKR(item.totalPrice)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-black/10 space-y-1.5 text-sm">
                      <div className="flex justify-between text-[#0B0B0D]/70">
                        <span>Subtotal</span>
                        <span className="tabular-nums">
                          {formatPKR(confirmedOrder.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#0B0B0D]/70">
                        <span>Delivery Charges</span>
                        <span className="tabular-nums">
                          {confirmedOrder.shippingFee === 0
                            ? 'Complimentary'
                            : formatPKR(confirmedOrder.shippingFee)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-black/10 flex items-center justify-between font-semibold text-base text-[#0B0B0D]">
                        <span>Total Payable (COD)</span>
                        <span className="tabular-nums">
                          {formatPKR(confirmedOrder.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSendConfirmedOrderToWhatsApp(confirmedOrder)
                      }
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full border border-black/15 bg-white text-[#0B0B0D] text-xs font-semibold hover:border-black transition-colors cursor-pointer min-h-[42px]"
                    >
                      <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                      <span>Share Order # on WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full py-3.5 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] transition-colors cursor-pointer min-h-[44px]"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#FDF5F8] border border-[#F4CBD8] flex items-center justify-center text-[#0B0B0D]">
                    <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-2xl font-medium text-[#0B0B0D]">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-[#0B0B0D]/60 max-w-xs">
                      Select a signature fragrance from our collection to begin your order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-[#0B0B0D] text-white text-xs font-medium tracking-wide hover:bg-[#222228] transition-colors cursor-pointer"
                  >
                    Explore Collection
                  </button>
                </div>
              ) : step === 'bag' ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[#FDF5F8] border border-[#F4CBD8] text-xs text-[#0B0B0D]/80 leading-relaxed">
                    {cartSubtotal >= 4000 ? (
                      <span>
                        Complimentary nationwide delivery unlocked on this order.
                      </span>
                    ) : (
                      <span>
                        Add{' '}
                        <strong className="font-semibold tabular-nums">
                          {formatPKR(4000 - cartSubtotal)}
                        </strong>{' '}
                        more for complimentary nationwide shipping (standard delivery{' '}
                        <span className="tabular-nums">
                          {formatPKR(configuredDelivery)}
                        </span>
                        ).
                      </span>
                    )}
                  </div>

                  <ul className="divide-y divide-black/10">
                    <AnimatePresence initial={false}>
                      {cart.map((item) => {
                        const availableStock = getProductStock(item.productId);
                        const atStockLimit =
                          availableStock > 0 && item.quantity >= availableStock;

                        return (
                          <motion.li
                            key={item.productId}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 24 }}
                            transition={{ duration: 0.2 }}
                            className="py-5 flex gap-4"
                          >
                            <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#141418] border border-black/10 shrink-0">
                              <LuxuryImage
                                src={item.imageUrl}
                                alt={`${item.name} perfume bottle`}
                                className="w-full h-full object-cover"
                                fallbackLabel={item.name}
                              />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-display text-xl font-semibold text-[#0B0B0D] truncate">
                                    {item.name}
                                  </h3>
                                  <p className="text-xs text-[#0B0B0D]/55 tabular-nums">
                                    {formatPKR(item.price)} each · {item.volume}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.productId)}
                                  aria-label={`Remove ${item.name}`}
                                  className="p-1.5 text-[#0B0B0D]/45 hover:text-[#0B0B0D] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-3 pt-2">
                                <div className="inline-flex items-center border border-black/15 rounded-full bg-white">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCartQuantity(
                                        item.productId,
                                        item.quantity - 1
                                      )
                                    }
                                    aria-label={`Decrease quantity of ${item.name}`}
                                    className="w-8 h-8 flex items-center justify-center text-[#0B0B0D] hover:bg-black/5 rounded-l-full cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2.5 text-xs font-semibold tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={atStockLimit}
                                    onClick={() =>
                                      updateCartQuantity(
                                        item.productId,
                                        item.quantity + 1
                                      )
                                    }
                                    aria-label={`Increase quantity of ${item.name}`}
                                    className="w-8 h-8 flex items-center justify-center text-[#0B0B0D] hover:bg-black/5 disabled:opacity-35 disabled:cursor-not-allowed rounded-r-full cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <p className="text-sm font-semibold text-[#0B0B0D] tabular-nums">
                                  {formatPKR(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                </div>
              ) : (
                <form
                  id="cod-checkout-form"
                  onSubmit={handlePlaceOrder}
                  className="space-y-4"
                >
                  <p className="text-xs text-[#0B0B0D]/65 leading-relaxed">
                    No account or sign-in required. Complete your delivery details below
                    to confirm your order.
                  </p>

                  {orderError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-[#FDF5F8] border border-[#D997AD] flex items-start gap-2.5 text-xs text-[#0B0B0D]"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-name"
                      className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                    >
                      Full Name *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ayesha Khan"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                      >
                        Mobile Number *
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        minLength={10}
                        maxLength={25}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-email"
                        className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                      >
                        Email (Optional)
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        maxLength={120}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-city"
                      className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                    >
                      City *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Karachi, Lahore, Islamabad..."
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                    >
                      Complete Delivery Address *
                    </label>
                    <textarea
                      id="checkout-address"
                      rows={3}
                      required
                      minLength={8}
                      maxLength={400}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="House/flat number, street, sector/block, landmark"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D] resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-notes"
                      className="block text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70"
                    >
                      Order Notes (Optional)
                    </label>
                    <input
                      id="checkout-notes"
                      type="text"
                      maxLength={300}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Gift note, preferred delivery time..."
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B0B0D]"
                    />
                  </div>

                  {/* Extensible Payment Selector */}
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0B0B0D]/70">
                      Payment Method
                    </p>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.filter((m) => m.enabled).map((method) => {
                        const isSelected = selectedPayment === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedPayment(method.id)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#0B0B0D] bg-[#FDF5F8]'
                                : 'border-black/15 bg-white hover:border-black/35'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Banknote className="w-4 h-4 text-[#0B0B0D]" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#0B0B0D]">
                                {method.label}
                              </p>
                              <p className="text-xs text-[#0B0B0D]/65 mt-0.5">
                                {method.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Summary & Actions */}
            {cart.length > 0 && step !== 'confirmed' && (
              <div className="px-5 sm:px-6 py-5 border-t border-black/10 bg-[#FAF8F9] space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-[#0B0B0D]/70">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPKR(cartSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#0B0B0D]/70">
                    <span>Delivery Charges</span>
                    <span className="tabular-nums">
                      {cartDeliveryFee === 0
                        ? 'Complimentary'
                        : formatPKR(cartDeliveryFee)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-black/10 flex items-center justify-between font-semibold text-base text-[#0B0B0D]">
                    <span>Total</span>
                    <span className="tabular-nums">{formatPKR(cartTotal)}</span>
                  </div>
                </div>

                {step === 'bag' ? (
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="w-full py-3.5 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] transition-colors cursor-pointer min-h-[44px]"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="cod-checkout-form"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#0B0B0D] text-white text-sm font-medium hover:bg-[#222228] disabled:opacity-60 transition-colors cursor-pointer min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying &amp; Placing Order...</span>
                      </>
                    ) : (
                      <span>Place Order · {formatPKR(cartTotal)}</span>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
