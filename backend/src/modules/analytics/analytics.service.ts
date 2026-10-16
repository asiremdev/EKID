import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export interface TrackInput {
  name: string;
  userId?: string;
  childId?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record a raw analytics event + roll it into the day's metric counters. */
  async track(input: TrackInput) {
    const day = startOfUtcDay();
    const value = input.value ?? 1;

    await this.prisma.analyticsEvent.create({
      data: {
        name: input.name,
        userId: input.userId,
        childId: input.childId,
        value,
        metadata: input.metadata as any,
      },
    });

    const inc: Record<string, { increment: number }> = {};
    if (input.name === 'activity_started') inc.activitiesStarted = { increment: 1 };
    if (input.name === 'activity_completed') inc.activitiesCompleted = { increment: 1 };
    if (input.name === 'stars_earned') inc.starsEarned = { increment: value };
    if (input.name === 'minutes_unlocked') inc.minutesUnlocked = { increment: value };

    if (Object.keys(inc).length > 0) {
      await this.prisma.dailyMetric.upsert({
        where: { day },
        create: {
          day,
          activitiesStarted: input.name === 'activity_started' ? 1 : 0,
          activitiesCompleted: input.name === 'activity_completed' ? 1 : 0,
          starsEarned: input.name === 'stars_earned' ? value : 0,
          minutesUnlocked: input.name === 'minutes_unlocked' ? value : 0,
        },
        update: inc,
      });
    }
  }

  /** Active children counts: DAU (today) and WAU (last 7 days). */
  async activeUsers() {
    const today = startOfUtcDay();
    const weekAgo = new Date(today.getTime() - 6 * 86_400_000);

    const [dauRows, wauRows] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: today }, childId: { not: null } },
        select: { childId: true },
        distinct: ['childId'],
      }),
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: weekAgo }, childId: { not: null } },
        select: { childId: true },
        distinct: ['childId'],
      }),
    ]);

    return { dau: dauRows.length, wau: wauRows.length };
  }

  async overview(days = 14) {
    const since = startOfUtcDay(new Date(Date.now() - (days - 1) * 86_400_000));
    const [metrics, active] = await Promise.all([
      this.prisma.dailyMetric.findMany({ where: { day: { gte: since } }, orderBy: { day: 'asc' } }),
      this.activeUsers(),
    ]);

    const totals = metrics.reduce(
      (acc, m) => {
        acc.activitiesStarted += m.activitiesStarted;
        acc.activitiesCompleted += m.activitiesCompleted;
        acc.starsEarned += m.starsEarned;
        acc.minutesUnlocked += m.minutesUnlocked;
        return acc;
      },
      { activitiesStarted: 0, activitiesCompleted: 0, starsEarned: 0, minutesUnlocked: 0 },
    );

    const completionRate =
      totals.activitiesStarted > 0
        ? Math.round((totals.activitiesCompleted / totals.activitiesStarted) * 100)
        : 0;

    return { ...active, totals, completionRate, daily: metrics };
  }

  /** Per-child analytics summary. */
  async childSummary(childId: string) {
    const [started, completed, starsAgg] = await this.prisma.$transaction([
      this.prisma.activityAttempt.count({ where: { childId } }),
      this.prisma.activityAttempt.count({ where: { childId, status: 'COMPLETED' } }),
      this.prisma.starTransaction.aggregate({
        where: { childId, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);
    return {
      activitiesStarted: started,
      activitiesCompleted: completed,
      completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
      starsEarnedTotal: starsAgg._sum.amount ?? 0,
    };
  }
}
