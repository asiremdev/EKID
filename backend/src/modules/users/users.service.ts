import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private select = {
    id: true,
    email: true,
    name: true,
    role: true,
    emailVerified: true,
    avatarUrl: true,
    locale: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  };

  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { ...this.select, subscription: true, _count: { select: { children: true } } },
    });
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: this.select,
    });
    await this.audit.log({ userId, action: 'user.update', entity: 'User', entityId: userId });
    return user;
  }

  /** Soft-delete: deactivate + revoke sessions, preserving referential history. */
  async deactivate(userId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { isActive: false } }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.log({ userId, action: 'user.deactivate', entity: 'User', entityId: userId });
    return { success: true };
  }

  /** Hard delete (cascades children, sessions, etc.). */
  async remove(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    await this.audit.log({ action: 'user.delete', entity: 'User', entityId: userId });
    return { success: true };
  }
}
