import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'parent@kiddy.app' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token delivered by email' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'N3wSecret!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldSecret!' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'N3wSecret!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token' })
  @IsString()
  token!: string;
}

export class RefreshDto {
  @ApiProperty({ required: false, description: 'Refresh token (if not sent as cookie)' })
  @IsString()
  refreshToken?: string;
}
