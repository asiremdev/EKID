import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AgeGroup } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChildDto {
  @ApiProperty({ example: 'Mia' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @ApiPropertyOptional({ example: 'fox' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: AgeGroup, example: AgeGroup.AGE_5_7 })
  @IsEnum(AgeGroup)
  ageGroup!: AgeGroup;
}

export class UpdateChildDto extends PartialType(CreateChildDto) {}
