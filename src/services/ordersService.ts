import { callAdminApi } from '../lib/adminApi';
import { supabase } from '../lib/supabase';
import { PaymentMethodId } from '../types/payment';
import { CartItem, OrderRecord, OrderStatus } from '../types/store';

export interface GuestOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  shippingAddress: string;
  orderNotes: string;
  paymentMethod: PaymentMethodId;
  items: CartItem[];
}

interface GuestOrderServerLineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface GuestOrderServerResponse {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_charges: number;
  total_amount: number;
  payment_method: PaymentMethodId;
  order_status: OrderStatus;
  created_at: string;
  items?: GuestOrderServerLineItem[];
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  complete_address: string;
  order_notes: string;
  subtotal: number | string;
  delivery_charges: number | string;
  total_amount: number | string;
  payment_method: PaymentMethodId | 'WhatsApp';
  order_status: OrderStatus;
  created_at: string;
  order_items?: Array<{
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number | string;
    total_price: number | string;
  }>;
}

function mapServerOrderToRecord(
  res: GuestOrderServerResponse,
  input: GuestOrderInput
): OrderRecord {
  const authoritativeItems =
    Array.isArray(res.items) && res.items.length > 0
      ? res.items.map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
        }))
      : input.items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        }));

  return {
    id: res.id,
    orderNumber: res.order_number,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail.trim(),
    city: input.city.trim(),
    shippingAddress: input.shippingAddress.trim(),
    orderNotes: input.orderNotes.trim(),
    items: authoritativeItems,
    subtotal: Number(res.subtotal),
    shippingFee: Number(res.delivery_charges),
    total: Number(res.total_amount),
    paymentMethod: res.payment_method,
    orderStatus: res.order_status,
    createdAt: res.created_at,
  };
}

export async function submitGuestOrderToSupabase(
  input: GuestOrderInput
): Promise<OrderRecord> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  // Send only product_id and quantity; server derives all prices & totals.
  const serverItems = input.items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  const payload = {
    customer_name: input.customerName.trim(),
    phone: input.customerPhone.trim(),
    email: input.customerEmail.trim(),
    city: input.city.trim(),
    complete_address: input.shippingAddress.trim(),
    order_notes: input.orderNotes.trim(),
    payment_method: input.paymentMethod,
    items: serverItems,
  };

  // Prefer Supabase Edge Function when deployed; fall back cleanly to
  // atomic server-side RPC if Edge Function has not been deployed yet.
  try {
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'create-order',
      { body: payload }
    );

    if (!fnError && fnData?.order) {
      return mapServerOrderToRecord(
        fnData.order as GuestOrderServerResponse,
        input
      );
    }

    if (fnError && fnError.name !== 'FunctionsFetchError') {
      const context = (fnError as { context?: { json?: () => Promise<{ error?: string }> } }).context;
      if (context && typeof context.json === 'function') {
        const errBody = await context.json().catch(() => null);
        if (errBody?.error) {
          throw new Error(errBody.error);
        }
      }
    }
  } catch (edgeErr) {
    if (
      edgeErr instanceof Error &&
      edgeErr.name !== 'FunctionsFetchError' &&
      !edgeErr.message.includes('Failed to send a request to the Edge Function')
    ) {
      throw edgeErr;
    }
  }

  const { data, error } = await supabase.rpc('create_guest_order', {
    p_customer_name: payload.customer_name,
    p_phone: payload.phone,
    p_email: payload.email,
    p_city: payload.city,
    p_complete_address: payload.complete_address,
    p_order_notes: payload.order_notes,
    p_payment_method: payload.payment_method,
    p_items: serverItems,
  });

  if (error || !data) {
    throw new Error(error?.message || 'Unable to submit order. Please try again.');
  }

  return mapServerOrderToRecord(data as GuestOrderServerResponse, input);
}

export async function fetchAdminOrdersFromSupabase(): Promise<OrderRecord[]> {
  const { orders } = await callAdminApi<{ orders: OrderRow[] }>('orders', {
    method: 'GET',
  });

  return (orders ?? []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.phone,
    customerEmail: row.email ?? '',
    city: row.city,
    shippingAddress: row.complete_address,
    orderNotes: row.order_notes ?? '',
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id ?? '',
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    })),
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.delivery_charges),
    total: Number(row.total_amount),
    paymentMethod: row.payment_method,
    orderStatus: row.order_status,
    createdAt: row.created_at,
  }));
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  await callAdminApi<{ updated: boolean }>('orders', {
    method: 'PATCH',
    body: { orderId, status },
  });
}
