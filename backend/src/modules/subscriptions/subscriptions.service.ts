import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  PAYMENT_PROVIDER,
  PaymentProvider,
} from './payment/payment-provider.interface';
import { addMonths, maxKidsForSubscription, planDefinition, PUBLIC_PLANS } from './plans';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  listPlans() {
    return PUBLIC_PLANS.map((p) => ({
      plan: p.plan,
      label: p.label,
      months: p.months,
      amountDa: p.amountDa,
      amountCents: p.amountDa,
      currency: p.currency,
      maxKids: p.maxKids,
      lifetime: p.lifetime,
      badge: p.badge ?? null,
      blurb: p.blurb,
    }));
  }

  async getForUser(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new NotFoundException('Subscription not found');
    const kidsUsed = await this.prisma.child.count({ where: { parentId: userId } });
    return {
      ...subscription,
      isActive: this.isEntitled(subscription),
      maxKids: maxKidsForSubscription(subscription),
      kidsUsed,
    };
  }

  /** True when the user may use paid features (trial running or active plan). */
  private isEntitled(sub: {
    status: SubscriptionStatus;
    plan: SubscriptionPlan | null;
    trialEndsAt: Date;
    currentPeriodEnd: Date | null;
  }) {
    const now = new Date();
    if (sub.status === SubscriptionStatus.TRIAL) return sub.trialEndsAt > now;
    if (sub.status === SubscriptionStatus.ACTIVE) {
      if (sub.plan === SubscriptionPlan.LIFETIME) return true;
      return !sub.currentPeriodEnd || sub.currentPeriodEnd > now;
    }
    return false;
  }

  /** Lazily flips TRIAL/ACTIVE to EXPIRED when their window passed. */
  async refreshStatus(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    if (!this.isEntitled(sub) && sub.status !== SubscriptionStatus.CANCELLED) {
      return this.prisma.subscription.update({
        where: { userId },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    }
    return sub;
  }

  async isUserEntitled(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return sub ? this.isEntitled(sub) : false;
  }

  // ─── Checkout via abstract provider ──────────────────────────────────────────
  async createCheckout(userId: string, plan: SubscriptionPlan) {
    const def = planDefinition(plan);
    if (!def) throw new BadRequestException('Unknown plan');

    const checkout = await this.payments.createCheckout({
      userId,
      plan,
      amountCents: def.amountDa,
      currency: def.currency,
    });

    await this.prisma.payment.create({
      data: {
        userId,
        provider: checkout.provider,
        providerRef: checkout.providerRef,
        plan,
        amountCents: def.amountDa,
        currency: def.currency,
        status: PaymentStatus.PENDING,
      },
    });

    await this.audit.log({ userId, action: 'subscription.checkout_created', metadata: { plan } });
    return checkout;
  }

  // ─── Webhook handling ─────────────────────────────────────────────────────────
  async handleWebhook(payload: unknown, signature?: string) {
    const event = await this.payments.verifyWebhook(payload, signature);

    if (event.type === 'payment.succeeded' && event.userId && event.plan) {
      await this.activatePlan(event.userId, event.plan, event.providerRef);
    } else if (event.type === 'payment.failed' && event.providerRef) {
      await this.prisma.payment.updateMany({
        where: { providerRef: event.providerRef },
        data: { status: PaymentStatus.FAILED },
      });
    } else if (event.type === 'subscription.cancelled' && event.userId) {
      await this.cancel(event.userId);
    }
    return { received: true, type: event.type };
  }

  /** Manually activate (used by webhook + admin/manual provider testing). */
  async activatePlan(userId: string, plan: SubscriptionPlan, providerRef?: string) {
    const def = planDefinition(plan);
    if (!def) throw new BadRequestException('Unknown plan');
    const now = new Date();
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    const base = sub?.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
    const currentPeriodEnd = def.lifetime ? new Date('2099-12-31T00:00:00.000Z') : addMonths(base, def.months);

    const updated = await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        plan,
        currentPeriodEnd,
        cancelledAt: null,
        provider: this.payments.name,
        providerRef: providerRef ?? sub?.providerRef,
      },
    });

    if (providerRef) {
      await this.prisma.payment.updateMany({
        where: { providerRef },
        data: { status: PaymentStatus.SUCCEEDED, paidAt: now, subscriptionId: updated.id },
      });
    }

    await this.audit.log({
      userId,
      action: 'subscription.activated',
      entity: 'Subscription',
      entityId: updated.id,
      metadata: { plan, currentPeriodEnd },
    });
    return updated;
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.providerRef) {
      await this.payments.cancelSubscription(sub.providerRef).catch(() => undefined);
    }
    const updated = await this.prisma.subscription.update({
      where: { userId },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });
    await this.audit.log({ userId, action: 'subscription.cancelled' });
    return updated;
  }

  listPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
