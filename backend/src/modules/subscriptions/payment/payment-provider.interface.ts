import { SubscriptionPlan } from '@prisma/client';

export interface CreateCheckoutInput {
  userId: string;
  plan: SubscriptionPlan;
  amountCents: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutResult {
  /** Where the client should be redirected (or an opaque client secret). */
  checkoutUrl?: string;
  clientSecret?: string;
  providerRef: string;
  provider: string;
}

export interface WebhookResult {
  type: 'payment.succeeded' | 'payment.failed' | 'subscription.cancelled' | 'unknown';
  providerRef?: string;
  userId?: string;
  plan?: SubscriptionPlan;
  amountCents?: number;
  raw?: unknown;
}

/**
 * Payment provider contract. Concrete gateways (Stripe, Paddle, manual...) must
 * implement this. No gateway is hardcoded into business logic — the active
 * provider is resolved by PaymentService via the PAYMENT_PROVIDER token.
 */
export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(payload: unknown, signature?: string): Promise<WebhookResult>;
  cancelSubscription(providerRef: string): Promise<void>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
