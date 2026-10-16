import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RecordUsageDto {
  @ApiProperty({ example: 'com.google.android.youtube' })
  @IsString()
  appPackage!: string;

  @ApiProperty({ required: false, example: 'YouTube' })
  @IsOptional()
  @IsString()
  appLabel?: string;

  @ApiProperty({ minimum: 0, example: 12 })
  @IsInt()
  @Min(0)
  minutesUsed!: number;
}
