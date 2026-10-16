import { Global, Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment/payment-provider.interface';
import { ManualPaymentProvider } from './payment/providers/manual.provider';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Global()
@Module({
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionGuard,
    // Swap this provider (or resolve by env) to plug a real gateway.
    { provide: PAYMENT_PROVIDER, useClass: ManualPaymentProvider },
  ],
  exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule {}
