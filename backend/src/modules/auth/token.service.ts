import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccessToken(payload: { sub: string; email: string; role: string }): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      },
    );
  }

  async signRefreshToken(payload: { sub: string; sessionId: string }): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshTtl'),
      },
    );
  }

  /** Long-lived token for a paired WLIDI-kids device. */
  async signDeviceToken(payload: {
    childId: string;
    deviceId: string;
    parentId: string;
  }): Promise<string> {
    return this.jwt.signAsync(
      { ...payload, type: 'device' },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: '365d',
      },
    );
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string; sessionId: string }> {
    return this.jwt.verifyAsync(token, {
      secret: this.config.get<string>('jwt.refreshSecret'),
    });
  }

  /** Argon2id password hashing. */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /** Hash opaque tokens (refresh/verification/reset) before storing them. */
  async hashToken(token: string): Promise<string> {
    return argon2.hash(token, { type: argon2.argon2id });
  }

  async verifyTokenHash(hash: string, token: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, token);
    } catch {
      return false;
    }
  }

  generateOpaqueToken(bytes = 48): string {
    return randomBytes(bytes).toString('base64url');
  }
}
