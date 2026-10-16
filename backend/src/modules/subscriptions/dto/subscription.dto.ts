import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.MONTH_1 })
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}

export class WebhookDto {
  @ApiProperty({ description: 'Raw provider webhook payload' })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  signature?: string;
}
