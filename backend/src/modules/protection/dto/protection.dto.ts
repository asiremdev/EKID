import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProtectedAppDto {
  @IsString()
  packageName!: string;

  @IsOptional()
  @IsString()
  appLabel?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class SyncProtectedAppsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtectedAppDto)
  apps!: ProtectedAppDto[];
}

export class RewardRuleDto {
  @IsInt()
  @Min(1)
  starsRequired!: number;

  @IsInt()
  @Min(1)
  minutesGranted!: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SetRewardRulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RewardRuleDto)
  rules!: RewardRuleDto[];
}

export class SetProtectionActiveDto {
  @IsBoolean()
  active!: boolean;
}

export class AutoUnlockDto {
  @IsString()
  packageName!: string;

  @IsOptional()
  @IsString()
  appLabel?: string;
}
