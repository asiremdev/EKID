import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ActivityType, AgeGroup } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type!: ActivityType;

  @ApiProperty({ example: 'count-the-apples' })
  @IsString()
  slug!: string;

  @ApiProperty({ example: 'Count the Apples' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Tap the correct number of apples' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AgeGroup })
  @IsEnum(AgeGroup)
  ageGroup!: AgeGroup;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ example: 'math' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  starsReward?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @ApiProperty({
    description: 'Type-specific content (questions, pairs, tracing paths, ...)',
    example: { question: '2 + 2 = ?', options: ['3', '4', '5'], answerIndex: 1 },
  })
  @IsObject()
  metadata!: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
