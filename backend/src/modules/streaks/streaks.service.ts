import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90];

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime()) / 86_400_000);
}

@Injectable()
export class StreaksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register activity for "today" and recompute the streak.
   * Idempotent per UTC day. Returns the streak + any milestone reached.
   */
  async registerActivityDay(childId: string, tx?: Prisma.TransactionClient) {
    const run = async (client: Prisma.TransactionClient) => {
      const child = await client.child.findUniqueOrThrow({ where: { id: childId } });
      const today = startOfUtcDay();

      // Already counted today — no change.
      if (child.lastActiveDay && daysBetween(child.lastActiveDay, today) === 0) {
        return {
          currentStreak: child.currentStreak,
          bestStreak: child.bestStreak,
          milestone: null as number | null,
          changed: false,
        };
      }

      const gap = child.lastActiveDay ? daysBetween(child.lastActiveDay, today) : null;
      const currentStreak = gap === 1 ? child.currentStreak + 1 : 1;
      const bestStreak = Math.max(child.bestStreak, currentStreak);
      const milestone = STREAK_MILESTONES.includes(currentStreak) ? currentStreak : null;

      await client.child.update({
        where: { id: childId },
        data: { currentStreak, bestStreak, lastActiveDay: today },
      });

      await client.streakEvent.upsert({
        where: { childId_day: { childId, day: today } },
        create: { childId, day: today, streak: currentStreak, milestone },
        update: { streak: currentStreak, milestone },
      });

      return { currentStreak, bestStreak, milestone, changed: true };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async getStreak(childId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const nextMilestone = STREAK_MILESTONES.find((m) => m > child.currentStreak) ?? null;
    return {
      currentStreak: child.currentStreak,
      bestStreak: child.bestStreak,
      nextMilestone,
      milestones: STREAK_MILESTONES,
    };
  }

  history(childId: string, take = 90) {
    return this.prisma.streakEvent.findMany({
      where: { childId },
      orderBy: { day: 'desc' },
      take,
    });
  }
}
