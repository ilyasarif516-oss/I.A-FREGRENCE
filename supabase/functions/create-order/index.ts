// Supabase Edge Function: create-order
// Verifies product availability, stock, and authoritative PKR prices server-side.
// Never trusts frontend prices or totals.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

interface CreateOrderPayload {
  customer_name: string;
  phone: string;
  email?: string;
  city: string;
  complete_address: string;
  order_notes?: string;
  payment_method?: string;
  items: OrderItemInput[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await req.json()) as CreateOrderPayload;

    const customerName = String(body.customer_name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim();
    const city = String(body.city ?? '').trim();
    const completeAddress = String(body.complete_address ?? '').trim();
    const orderNotes = String(body.order_notes ?? '').trim();
    const paymentMethod = String(body.payment_method ?? 'COD').trim();

    if (customerName.length < 2 || customerName.length > 120) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid full name.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const phoneDigits = phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid mobile number.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid email address.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (city.length < 2 || city.length > 80) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid city name.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (completeAddress.length < 8 || completeAddress.length > 400) {
      return new Response(
        JSON.stringify({
          error: 'Please enter a complete delivery address.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (paymentMethod !== 'COD') {
      return new Response(
        JSON.stringify({ error: 'Unsupported payment method.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Your cart is empty.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Execute atomic PostgreSQL transaction via create_guest_order RPC
    const { data, error } = await supabaseAdmin.rpc('create_guest_order', {
      p_customer_name: customerName,
      p_phone: phone,
      p_email: email,
      p_city: city,
      p_complete_address: completeAddress,
      p_order_notes: orderNotes,
      p_payment_method: paymentMethod,
      p_items: body.items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
      })),
    });

    if (error || !data) {
      return new Response(
        JSON.stringify({
          error: error?.message || 'Unable to process order.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ order: data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unexpected server error.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
