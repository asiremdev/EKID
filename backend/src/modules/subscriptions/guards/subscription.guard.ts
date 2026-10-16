import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';

/**
 * Blocks access to gated features when the user's trial/subscription has lapsed.
 * Apply with @UseGuards(JwtAuthGuard, SubscriptionGuard) on premium routes.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user?.id) throw new ForbiddenException('Unauthenticated');

    const entitled = await this.subscriptions.isUserEntitled(user.id);
    if (!entitled) {
      throw new ForbiddenException('Active subscription or trial required');
    }
    return true;
  }
}
