import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCheckoutDto, WebhookDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans' })
  plans() {
    return this.subscriptions.listPlans();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get the current user subscription (auto-expires lapsed ones)' })
  async me(@CurrentUser('id') userId: string) {
    await this.subscriptions.refreshStatus(userId);
    return this.subscriptions.getForUser(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Start a checkout for a plan (provider-agnostic)' })
  checkout(@CurrentUser('id') userId: string, @Body() dto: CreateCheckoutDto) {
    return this.subscriptions.createCheckout(userId, dto.plan);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('payments')
  @ApiOperation({ summary: 'List payment history' })
  payments(@CurrentUser('id') userId: string) {
    return this.subscriptions.listPayments(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel the active subscription' })
  cancel(@CurrentUser('id') userId: string) {
    return this.subscriptions.cancel(userId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment provider webhook receiver' })
  webhook(@Body() dto: WebhookDto) {
    return this.subscriptions.handleWebhook(dto.payload, dto.signature);
  }
}
