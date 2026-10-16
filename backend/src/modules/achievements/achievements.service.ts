import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StarsService } from '../stars/stars.service';

/**
 * Dynamic achievement engine.
 *
 * Achievements are DB rows with a {metric, threshold}. After any progress event
 * we recompute the child's current value for each metric and unlock achievements
 * whose threshold is crossed, granting their star rewards through the ledger.
 *
 * Supported metrics: stars | streak | level | activities
 */
@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stars: StarsService,
  ) {}

  private async metricValues(childId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const activities = await this.prisma.activityAttempt.count({
      where: { childId, status: 'COMPLETED' },
    });
    return {
      stars: child.stars,
      streak: child.bestStreak,
      level: child.level,
      activities,
    } as Record<string, number>;
  }

  /** Evaluate all active achievements for a child; unlock + reward new ones. */
  async evaluate(childId: string): Promise<{ code: string; title: string; starsReward: number }[]> {
    const [achievements, existing, values] = await Promise.all([
      this.prisma.achievement.findMany({ where: { isActive: true } }),
      this.prisma.childAchievement.findMany({ where: { childId } }),
      this.metricValues(childId),
    ]);

    const existingMap = new Map(existing.map((e) => [e.achievementId, e]));
    const unlocked: { code: string; title: string; starsReward: number }[] = [];

    for (const ach of achievements) {
      const current = values[ach.metric] ?? 0;
      const prior = existingMap.get(ach.id);
      if (prior?.unlockedAt) {
        // Keep progress fresh but skip re-unlocking.
        if (prior.progress !== current) {
          await this.prisma.childAchievement.update({
            where: { id: prior.id },
            data: { progress: Math.min(current, ach.threshold) },
          });
        }
        continue;
      }

      const reached = current >= ach.threshold;
      await this.prisma.childAchievement.upsert({
        where: { childId_achievementId: { childId, achievementId: ach.id } },
        create: {
          childId,
          achievementId: ach.id,
          progress: Math.min(current, ach.threshold),
          unlockedAt: reached ? new Date() : null,
        },
        update: {
          progress: Math.min(current, ach.threshold),
          unlockedAt: reached ? new Date() : null,
        },
      });

      if (reached) {
        if (ach.starsReward > 0) {
          await this.stars
            .earn(childId, ach.starsReward, `achievement:${ach.code}`, ach.id)
            .catch((e) => this.logger.warn(`Reward failed for ${ach.code}: ${e.message}`));
        }
        unlocked.push({ code: ach.code, title: ach.title, starsReward: ach.starsReward });
      }
    }

    return unlocked;
  }

  async listForChild(childId: string) {
    const [achievements, child] = await Promise.all([
      this.prisma.achievement.findMany({ where: { isActive: true }, orderBy: { threshold: 'asc' } }),
      this.prisma.childAchievement.findMany({ where: { childId } }),
    ]);
    const map = new Map(child.map((c) => [c.achievementId, c]));
    return achievements.map((a) => ({
      ...a,
      progress: map.get(a.id)?.progress ?? 0,
      unlocked: !!map.get(a.id)?.unlockedAt,
      unlockedAt: map.get(a.id)?.unlockedAt ?? null,
    }));
  }

  listCatalog() {
    return this.prisma.achievement.findMany({ orderBy: { threshold: 'asc' } });
  }
}
