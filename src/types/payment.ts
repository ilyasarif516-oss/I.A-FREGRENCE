export type PaymentMethodId = 'COD';

export interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  shortLabel: string;
  description: string;
  enabled: boolean;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'COD',
    label: 'Cash on Delivery (COD)',
    shortLabel: 'COD',
    description: 'Pay in cash when your fragrance parcel arrives at your doorstep.',
    enabled: true,
  },
];
