-- =============================================================================
-- I.A FRAGRANCE — Checkout Hardening Migration
-- Aggregates duplicate product IDs in p_items, enforces atomic stock check,
-- and returns itemized server-calculated summary with unique order_number.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_guest_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_complete_address text,
  p_order_notes text,
  p_payment_method text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_product record;
  v_subtotal numeric(10, 2) := 0;
  v_delivery numeric(10, 2) := 0;
  v_configured_delivery numeric(10, 2) := 250;
  v_total numeric(10, 2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_created_at timestamptz;
  v_line_items jsonb := '[]'::jsonb;
  v_phone_digits text;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  IF jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'Too many items in a single order.';
  END IF;

  IF p_payment_method NOT IN ('COD') THEN
    RAISE EXCEPTION 'Unsupported payment method.';
  END IF;

  v_phone_digits := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF char_length(v_phone_digits) < 10 OR char_length(v_phone_digits) > 15 THEN
    RAISE EXCEPTION 'Please enter a valid mobile number.';
  END IF;

  IF char_length(trim(COALESCE(p_complete_address, ''))) < 8 THEN
    RAISE EXCEPTION 'Please enter a complete delivery address.';
  END IF;

  -- Aggregate quantities by product_id and validate stock + authoritative prices
  FOR v_item IN
    SELECT
      (elem ->> 'product_id')::uuid AS product_id,
      SUM(COALESCE((elem ->> 'quantity')::integer, 0))::integer AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem ->> 'product_id')::uuid
  LOOP
    IF v_item.quantity < 1 OR v_item.quantity > 50 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    SELECT id, name, price, stock, is_active
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND OR v_product.is_active IS NOT TRUE OR v_product.price IS NULL THEN
      RAISE EXCEPTION 'One or more selected products are no longer available.';
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Only % unit(s) of % available in stock.', v_product.stock, v_product.name;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  END LOOP;

  SELECT COALESCE(delivery_charges, 250)
  INTO v_configured_delivery
  FROM public.store_settings
  WHERE id = 1;

  IF v_subtotal >= 4000 THEN
    v_delivery := 0;
  ELSE
    v_delivery := v_configured_delivery;
  END IF;

  v_total := v_subtotal + v_delivery;

  INSERT INTO public.orders (
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
    order_status
  )
  VALUES (
    trim(p_customer_name),
    trim(p_phone),
    COALESCE(trim(p_email), ''),
    trim(p_city),
    trim(p_complete_address),
    COALESCE(trim(p_order_notes), ''),
    v_subtotal,
    v_delivery,
    v_total,
    p_payment_method,
    'pending'
  )
  RETURNING id, order_number, created_at
  INTO v_order_id, v_order_number, v_created_at;

  FOR v_item IN
    SELECT
      (elem ->> 'product_id')::uuid AS product_id,
      SUM(COALESCE((elem ->> 'quantity')::integer, 0))::integer AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem ->> 'product_id')::uuid
  LOOP
    SELECT id, name, price
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_item.quantity,
      v_product.price,
      v_product.price * v_item.quantity
    );

    UPDATE public.products
    SET stock = stock - v_item.quantity
    WHERE id = v_product.id
      AND stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient inventory for %.', v_product.name;
    END IF;

    v_line_items := v_line_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'quantity', v_item.quantity,
        'unit_price', v_product.price,
        'total_price', v_product.price * v_item.quantity
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_charges', v_delivery,
    'total_amount', v_total,
    'payment_method', p_payment_method,
    'order_status', 'pending',
    'created_at', v_created_at,
    'items', v_line_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_order(text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_order(text, text, text, text, text, text, text, jsonb) TO anon, authenticated;
