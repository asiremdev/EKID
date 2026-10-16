import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../auth/token.service';
import { ProtectionService } from '../protection/protection.service';
import { ChildrenService } from '../children/children.service';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class PairingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly protection: ProtectionService,
    private readonly children: ChildrenService,
  ) {}

  async createCode(parentId: string, childId?: string) {
    const child = childId
      ? await this.children.assertOwnership(parentId, childId)
      : await this.prisma.child.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' } });
    if (!child) throw new BadRequestException('Create a child profile first');

    await this.prisma.pairingCode.deleteMany({
      where: { parentId, usedAt: null, expiresAt: { lt: new Date() } },
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60_000);

    await this.prisma.pairingCode.create({
      data: { parentId, childId: child.id, code, expiresAt },
    });

    return { code, expiresAt: expiresAt.toISOString(), childId: child.id };
  }

  async getStatus(parentId: string, childId?: string) {
    const child = childId
      ? await this.prisma.child.findFirst({ where: { id: childId, parentId }, include: { device: true } })
      : await this.prisma.child.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' }, include: { device: true } });
    if (!child) return { paired: false, hasChild: false };
    const installedAppCount = await this.prisma.childInstalledApp.count({
      where: { childId: child.id },
    });
    return {
      hasChild: true,
      paired: !!child.device?.isPaired,
      deviceName: child.device?.deviceName ?? null,
      lastSyncAt: child.device?.lastSyncAt?.toISOString() ?? null,
      childId: child.id,
      installedAppCount,
      childSetupComplete: installedAppCount > 0,
    };
  }

  async reportInstalledApps(childId: string, apps: { packageName: string; appLabel?: string }[]) {
    if (!apps.length) throw new BadRequestException('No apps to report');

    await this.prisma.$transaction(async (tx) => {
      await tx.childInstalledApp.deleteMany({ where: { childId } });
      await tx.childInstalledApp.createMany({
        data: apps.map((a) => ({
          childId,
          packageName: a.packageName,
          appLabel: a.appLabel ?? null,
        })),
        skipDuplicates: true,
      });
      await tx.childDevice.updateMany({
        where: { childId },
        data: { lastSyncAt: new Date() },
      });
    });

    return { count: apps.length };
  }

  async listInstalledAppsForParent(parentId: string, childId?: string) {
    const child = childId
      ? await this.prisma.child.findFirst({ where: { id: childId, parentId } })
      : await this.prisma.child.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' } });
    if (!child) throw new NotFoundException('No child profile');
    const apps = await this.prisma.childInstalledApp.findMany({
      where: { childId: child.id },
      orderBy: { appLabel: 'asc' },
    });
    return apps.map((a) => ({
      packageName: a.packageName,
      appLabel: a.appLabel,
      reportedAt: a.reportedAt.toISOString(),
    }));
  }

  async claimPairing(code: string, deviceName?: string) {
    const row = await this.prisma.pairingCode.findFirst({
      where: { code, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!row) throw new NotFoundException('Invalid or expired pairing code');

    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: row.childId } });

    const device = await this.prisma.$transaction(async (tx) => {
      await tx.pairingCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });

      return tx.childDevice.upsert({
        where: { childId: child.id },
        create: {
          childId: child.id,
          deviceName: deviceName ?? 'Child device',
          isPaired: true,
          pairedAt: new Date(),
          lastSyncAt: new Date(),
        },
        update: {
          deviceName: deviceName ?? 'Child device',
          isPaired: true,
          lastSyncAt: new Date(),
        },
      });
    });

    const deviceToken = await this.tokens.signDeviceToken({
      childId: child.id,
      deviceId: device.id,
      parentId: row.parentId,
    });

    const sync = await this.protection.getSyncBundle(row.parentId, child.id);

    return {
      deviceToken,
      device: { id: device.id, name: device.deviceName },
      child: {
        id: child.id,
        name: child.name,
        ageGroup: child.ageGroup,
        stars: child.stars,
      },
      sync,
    };
  }

  async touchSync(childId: string) {
    await this.prisma.childDevice.updateMany({
      where: { childId },
      data: { lastSyncAt: new Date() },
    });
  }
}
