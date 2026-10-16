import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({ description: 'Child starting the activity' })
  childId!: string;
}

export class CompleteAttemptDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 90, description: 'Score 0..100' })
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiPropertyOptional({ example: 45, description: 'Duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Submitted answers payload' })
  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;
}
