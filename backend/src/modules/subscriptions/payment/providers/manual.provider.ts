import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  CheckoutResult,
  CreateCheckoutInput,
  PaymentProvider,
  WebhookResult,
} from '../payment-provider.interface';

/**
 * Default no-gateway provider. Lets the whole subscription flow be exercised in
 * development/tests and serves as a reference implementation for real gateways.
 */
@Injectable()
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = 'manual';

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const providerRef = `manual_${nanoid(16)}`;
    return {
      provider: this.name,
      providerRef,
      checkoutUrl: `about:blank#checkout=${providerRef}&plan=${input.plan}`,
    };
  }

  async verifyWebhook(payload: unknown): Promise<WebhookResult> {
    const body = (payload ?? {}) as Record<string, any>;
    return {
      type: body.type ?? 'unknown',
      providerRef: body.providerRef,
      userId: body.userId,
      plan: body.plan,
      amountCents: body.amountCents,
      raw: payload,
    };
  }

  async cancelSubscription(): Promise<void> {
    // No external state to cancel for the manual provider.
  }
}
