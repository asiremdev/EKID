import { Injectable } from '@nestjs/common';
import { UnlockStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StarsService } from '../stars/stars.service';

/** Stars → minutes conversion. 1 star buys 1 minute by default. */
export const STARS_PER_MINUTE = 1;

@Injectable()
export class UnlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stars: StarsService,
    private readonly audit: AuditService,
  ) {}

  /** Spend stars to unlock app time. Ledger + unlock row written atomically. */
  async unlockAppTime(childId: string, appPackage: string, minutes: number, appLabel?: string) {
    const cost = minutes * STARS_PER_MINUTE;

    const result = await this.prisma.$transaction(async (client) => {
      await this.stars.post(
        childId,
        {
          type: 'UNLOCK',
          amount: -cost,
          reason: `unlock:${appPackage}`,
          metadata: { appPackage, minutes },
        },
        client,
      );

      const unlock = await client.unlock.create({
        data: {
          childId,
          appPackage,
          appLabel,
          minutes,
          starsCost: cost,
          status: UnlockStatus.ACTIVE,
          expiresAt: new Date(Date.now() + minutes * 60_000),
        },
      });

      await client.child.update({
        where: { id: childId },
        data: { minutesEarned: { increment: minutes } },
      });

      return unlock;
    });

    await this.audit.log({
      action: 'stars.unlock_app_time',
      entity: 'Unlock',
      entityId: result.id,
      metadata: { childId, appPackage, minutes, cost },
    });
    return result;
  }

  async listActive(childId: string) {
    // Lazily expire anything past its window.
    await this.prisma.unlock.updateMany({
      where: { childId, status: UnlockStatus.ACTIVE, expiresAt: { lt: new Date() } },
      data: { status: UnlockStatus.EXPIRED },
    });
    return this.prisma.unlock.findMany({
      where: { childId, status: UnlockStatus.ACTIVE },
      orderBy: { expiresAt: 'asc' },
    });
  }

  history(childId: string, take = 50) {
    return this.prisma.unlock.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async cancel(childId: string, unlockId: string) {
    await this.prisma.unlock.updateMany({
      where: { id: unlockId, childId },
      data: { status: UnlockStatus.CANCELLED },
    });
    return { success: true };
  }

  /** Record actual usage minutes (synced from the Android app). */
  async recordUsage(childId: string, appPackage: string, minutesUsed: number, appLabel?: string) {
    const day = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()),
    );
    await this.prisma.$transaction([
      this.prisma.usageHistory.create({
        data: { childId, appPackage, appLabel, minutesUsed, day },
      }),
      this.prisma.child.update({
        where: { id: childId },
        data: { minutesSpent: { increment: minutesUsed } },
      }),
    ]);
    return { success: true };
  }

  usageHistory(childId: string, take = 100) {
    return this.prisma.usageHistory.findMany({
      where: { childId },
      orderBy: { day: 'desc' },
      take,
    });
  }
}
