import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus, TokenType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { ClientInfo } from '../../common/decorators/client-info.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  private sanitize(user: { passwordHash?: string } & Record<string, any>) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private async issueTokens(user: { id: string; email: string; role: string }, client: ClientInfo) {
    const { refreshToken, sessionId } = await this.sessions.createSession(user.id, {
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, refreshToken, sessionId };
  }

  // ─── Register ──────────────────────────────────────────────────────────────
  async register(dto: RegisterDto, client: ClientInfo) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await this.tokens.hashPassword(dto.password);
    const trialDays = this.config.get<number>('subscription.trialDays', 3);
    const trialEndsAt = new Date(Date.now() + trialDays * 86_400_000);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        locale: dto.locale ?? 'en',
        subscription: {
          create: {
            status: SubscriptionStatus.TRIAL,
            trialEndsAt,
          },
        },
      },
    });

    // Email verification token (architecture in place; mail provider is console by default)
    await this.createAndSendVerification(user.id, user.email);

    const tokens = await this.issueTokens(user, client);
    await this.audit.log({
      userId: user.id,
      action: 'auth.register',
      entity: 'User',
      entityId: user.id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return { user: this.sanitize(user), ...tokens };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, client: ClientInfo) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.tokens.verifyPassword(user.passwordHash, dto.password);
    if (!valid) {
      await this.audit.log({
        userId: user.id,
        action: 'auth.login_failed',
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, client);
    await this.audit.log({
      userId: user.id,
      action: 'auth.login',
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    });

    return { user: this.sanitize(user), ...tokens };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────
  async refresh(presentedToken: string) {
    if (!presentedToken) throw new UnauthorizedException('Missing refresh token');

    let payload: { sub: string; sessionId: string };
    try {
      payload = await this.tokens.verifyRefreshToken(presentedToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessions.validateSession(payload.sessionId, presentedToken);
    if (!session) throw new UnauthorizedException('Session expired or revoked');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive');

    const refreshToken = await this.sessions.rotateSession(session.id, user.id);
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, refreshToken };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  async logout(presentedToken: string) {
    if (!presentedToken) return { success: true };
    try {
      const payload = await this.tokens.verifyRefreshToken(presentedToken);
      await this.sessions.revokeSession(payload.sessionId);
      await this.audit.log({ userId: payload.sub, action: 'auth.logout' });
    } catch {
      // Silently succeed — logout should be idempotent.
    }
    return { success: true };
  }

  async logoutAll(userId: string) {
    const count = await this.sessions.revokeAllSessions(userId);
    await this.audit.log({ userId, action: 'auth.logout_all', metadata: { revoked: count } });
    return { success: true, revoked: count };
  }

  listSessions(userId: string) {
    return this.sessions.listSessions(userId);
  }

  // ─── Email verification ──────────────────────────────────────────────────────
  private async createAndSendVerification(userId: string, email: string) {
    const token = this.tokens.generateOpaqueToken();
    const tokenHash = await this.tokens.hashToken(token);
    const ttl = this.config.get<number>('tokens.emailVerificationTtl', 86_400);
    await this.prisma.authToken.create({
      data: {
        userId,
        type: TokenType.EMAIL_VERIFICATION,
        tokenHash,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    await this.mail.sendVerificationEmail(email, token);
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerified) throw new BadRequestException('Email already verified');
    await this.createAndSendVerification(user.id, user.email);
    return { success: true };
  }

  async verifyEmail(token: string) {
    const candidate = await this.findValidToken(token, TokenType.EMAIL_VERIFICATION);
    if (!candidate) throw new BadRequestException('Invalid or expired verification token');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: candidate.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.authToken.update({
        where: { id: candidate.id },
        data: { usedAt: new Date() },
      }),
    ]);
    await this.audit.log({ userId: candidate.userId, action: 'auth.email_verified' });
    return { success: true };
  }

  // ─── Password reset ──────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    // Always return success to avoid account enumeration.
    if (!user) return { success: true };

    const token = this.tokens.generateOpaqueToken();
    const tokenHash = await this.tokens.hashToken(token);
    const ttl = this.config.get<number>('tokens.passwordResetTtl', 3600);
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: TokenType.PASSWORD_RESET,
        tokenHash,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });
    await this.mail.sendPasswordResetEmail(user.email, token);
    await this.audit.log({ userId: user.id, action: 'auth.password_reset_requested' });
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const candidate = await this.findValidToken(dto.token, TokenType.PASSWORD_RESET);
    if (!candidate) throw new BadRequestException('Invalid or expired reset token');

    const passwordHash = await this.tokens.hashPassword(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: candidate.userId }, data: { passwordHash } }),
      this.prisma.authToken.update({ where: { id: candidate.id }, data: { usedAt: new Date() } }),
    ]);
    // Security: revoke all sessions after a password reset.
    await this.sessions.revokeAllSessions(candidate.userId);
    await this.audit.log({ userId: candidate.userId, action: 'auth.password_reset' });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await this.tokens.verifyPassword(user.passwordHash, dto.currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await this.tokens.hashPassword(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.sessions.revokeAllSessions(userId);
    await this.audit.log({ userId, action: 'auth.password_changed' });
    return { success: true };
  }

  /** Find a non-used, non-expired token by comparing hashes. */
  private async findValidToken(token: string, type: TokenType) {
    const candidates = await this.prisma.authToken.findMany({
      where: { type, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    for (const candidate of candidates) {
      if (await this.tokens.verifyTokenHash(candidate.tokenHash, token)) {
        return candidate;
      }
    }
    return null;
  }
}
