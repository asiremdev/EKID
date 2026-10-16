import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'parent@kiddy.app' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Sup3rSecret!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Alex Parent' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ required: false, example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}
