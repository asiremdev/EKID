import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class EarnStarsDto {
  @ApiProperty({ minimum: 1, example: 10 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'manual_bonus' })
  @IsString()
  reason!: string;
}

export class SpendStarsDto {
  @ApiProperty({ minimum: 1, example: 5 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'reward_redeem' })
  @IsString()
  reason!: string;
}

export class TransferStarsDto {
  @ApiProperty({ description: 'Destination child id' })
  @IsString()
  toChildId!: string;

  @ApiProperty({ minimum: 1, example: 10 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ required: false, example: 'sibling_gift' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UnlockAppTimeDto {
  @ApiProperty({ example: 'com.google.android.youtube' })
  @IsString()
  appPackage!: string;

  @ApiProperty({ required: false, example: 'YouTube' })
  @IsOptional()
  @IsString()
  appLabel?: string;

  @ApiProperty({ minimum: 1, example: 30, description: 'Minutes to unlock' })
  @IsInt()
  @Min(1)
  minutes!: number;
}
