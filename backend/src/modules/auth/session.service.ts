import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from './token.service';

interface ClientMeta {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  private refreshTtlMs(): number {
    // Parse "30d" / "12h" / "900s" style TTLs into milliseconds.
    const ttl = this.config.get<string>('jwt.refreshTtl', '30d');
    const match = /^(\d+)([smhd])$/.exec(ttl.trim());
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
    return value * factor;
  }

  /** Create a session row and return the signed refresh token. */
  async createSession(userId: string, meta: ClientMeta): Promise<{ refreshToken: string; sessionId: string }> {
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'pending',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceName: meta.deviceName,
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
      },
    });

    const refreshToken = await this.tokens.signRefreshToken({ sub: userId, sessionId: session.id });
    const refreshTokenHash = await this.tokens.hashToken(refreshToken);
    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    return { refreshToken, sessionId: session.id };
  }

  /** Rotate a session's refresh token (issued on every refresh). */
  async rotateSession(sessionId: string, userId: string): Promise<string> {
    const refreshToken = await this.tokens.signRefreshToken({ sub: userId, sessionId });
    const refreshTokenHash = await this.tokens.hashToken(refreshToken);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
      },
    });
    return refreshToken;
  }

  async validateSession(sessionId: string, presentedToken: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      return null;
    }
    const valid = await this.tokens.verifyTokenHash(session.refreshTokenHash, presentedToken);
    return valid ? session : null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceName: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}
