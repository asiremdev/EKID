import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AgeGroup, ChallengeType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ enum: ChallengeType })
  @IsEnum(ChallengeType)
  type!: ChallengeType;

  @ApiProperty({ example: 'Daily Explorer' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Complete 3 activities today' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'activities', enum: ['activities', 'stars', 'xp'] })
  @IsString()
  metric!: string;

  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  target!: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  starsReward?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @ApiProperty({ example: '2026-06-20T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-06-21T00:00:00.000Z' })
  @IsDateString()
  endsAt!: string;
}

export class UpdateChallengeDto extends PartialType(CreateChallengeDto) {}
