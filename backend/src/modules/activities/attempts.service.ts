import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttemptStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ChallengesService } from '../challenges/challenges.service';
import { StarsService } from '../stars/stars.service';
import { StreaksService } from '../streaks/streaks.service';
import { XpService } from '../xp/xp.service';
import { CompleteAttemptDto } from './dto/attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stars: StarsService,
    private readonly xp: XpService,
    private readonly streaks: StreaksService,
    private readonly achievements: AchievementsService,
    private readonly challenges: ChallengesService,
    private readonly analytics: AnalyticsService,
  ) {}

  async start(childId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity || !activity.isActive) throw new NotFoundException('Activity not found');

    const attempt = await this.prisma.activityAttempt.create({
      data: { childId, activityId, status: AttemptStatus.STARTED },
    });
    await this.analytics.track({ name: 'activity_started', childId, metadata: { activityId } });
    return attempt;
  }

  /**
   * Complete an attempt and grant rewards. Reward = activity reward scaled by
   * score. Stars + XP are credited through the ledger / XP service, the streak
   * for today is registered, challenges advanced, and achievements re-evaluated.
   */
  async complete(childId: string, attemptId: string, dto: CompleteAttemptDto) {
    const attempt = await this.prisma.activityAttempt.findUnique({
      where: { id: attemptId },
      include: { activity: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.childId !== childId) throw new BadRequestException('Attempt does not belong to child');
    if (attempt.status === AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt already completed');
    }

    const scoreFactor = dto.score / 100;
    const starsEarned = Math.round(attempt.activity.starsReward * scoreFactor);
    const xpEarned = Math.round(attempt.activity.xpReward * scoreFactor);

    // Persist the attempt result + reward bookkeeping atomically.
    await this.prisma.$transaction(async (client) => {
      await client.activityAttempt.update({
        where: { id: attemptId },
        data: {
          status: AttemptStatus.COMPLETED,
          score: dto.score,
          starsEarned,
          xpEarned,
          durationSeconds: dto.durationSeconds ?? 0,
          answers: dto.answers as any,
          completedAt: new Date(),
        },
      });

      if (starsEarned > 0) {
        await this.stars.earn(childId, starsEarned, `activity:${attempt.activityId}`, attemptId, client);
      }
      if (xpEarned > 0) {
        await this.xp.award(
          childId,
          { amount: xpEarned, source: 'activity', referenceId: attemptId },
          client,
        );
      }
      await this.streaks.registerActivityDay(childId, client);
    });

    // Post-reward side effects (own transactions / external counters).
    await this.analytics.track({ name: 'activity_completed', childId, metadata: { attemptId } });
    if (starsEarned > 0) {
      await this.analytics.track({ name: 'stars_earned', childId, value: starsEarned });
    }
    await this.challenges.addProgress(childId, 'activities', 1);
    if (starsEarned > 0) await this.challenges.addProgress(childId, 'stars', starsEarned);
    if (xpEarned > 0) await this.challenges.addProgress(childId, 'xp', xpEarned);

    const unlockedAchievements = await this.achievements.evaluate(childId);
    const progress = await this.xp.getProgress(childId);
    const streak = await this.streaks.getStreak(childId);

    return {
      attemptId,
      score: dto.score,
      starsEarned,
      xpEarned,
      level: progress.level,
      progress,
      streak,
      unlockedAchievements,
    };
  }

  async abandon(childId: string, attemptId: string) {
    const attempt = await this.prisma.activityAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.childId !== childId) throw new NotFoundException('Attempt not found');
    return this.prisma.activityAttempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.ABANDONED },
    });
  }

  listForChild(childId: string, take = 50) {
    return this.prisma.activityAttempt.findMany({
      where: { childId },
      orderBy: { startedAt: 'desc' },
      take,
      include: { activity: { select: { title: true, type: true, subject: true } } },
    });
  }
}
