// src/auth/dto/auth.dto.ts
import { IsEmail, IsString, Length, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiPropertyOptional({ example: 'fr', enum: ['fr', 'en', 'es', 'pt', 'ht'] })
  @IsOptional()
  @IsIn(['fr', 'en', 'es', 'pt', 'ht'])
  language?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({ example: '482910' })
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    role: string;
    isVerified: boolean;
    language: string;
  };

  @ApiProperty()
  isNewUser: boolean;
}
