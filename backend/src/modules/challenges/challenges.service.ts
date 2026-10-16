import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StarsService } from '../stars/stars.service';
import { XpService } from '../xp/xp.service';
import { CreateChallengeDto, UpdateChallengeDto } from './dto/challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stars: StarsService,
    private readonly xp: XpService,
  ) {}

  // ─── Admin/CRUD ────────────────────────────────────────────────────────────
  create(dto: CreateChallengeDto) {
    return this.prisma.challenge.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  update(id: string, dto: UpdateChallengeDto) {
    const data: Prisma.ChallengeUpdateInput = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);
    return this.prisma.challenge.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.challenge.delete({ where: { id } });
  }

  /** Currently-running challenges (optionally filtered to a child's age group). */
  async listActive(ageGroup?: string) {
    const now = new Date();
    return this.prisma.challenge.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        ...(ageGroup ? { OR: [{ ageGroup: ageGroup as any }, { ageGroup: null }] } : {}),
      },
      orderBy: { endsAt: 'asc' },
    });
  }

  /** Active challenges merged with a child's progress. */
  async listForChild(childId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const challenges = await this.listActive(child.ageGroup);
    const progress = await this.prisma.challengeProgress.findMany({
      where: { childId, challengeId: { in: challenges.map((c) => c.id) } },
    });
    const map = new Map(progress.map((p) => [p.challengeId, p]));
    return challenges.map((c) => ({
      ...c,
      progress: map.get(c.id)?.progress ?? 0,
      completed: map.get(c.id)?.completed ?? false,
      rewardClaimed: map.get(c.id)?.rewardClaimed ?? false,
    }));
  }

  /**
   * Increment progress for all active challenges matching `metric` for a child.
   * Called from the activity/stars flows. Auto-completes + rewards on target.
   */
  async addProgress(childId: string, metric: string, amount: number) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const challenges = await this.listActive(child.ageGroup);
    const matching = challenges.filter((c) => c.metric === metric);
    const completedNow: string[] = [];

    for (const challenge of matching) {
      const existing = await this.prisma.challengeProgress.findUnique({
        where: { childId_challengeId: { childId, challengeId: challenge.id } },
      });
      if (existing?.completed) continue;

      const progress = (existing?.progress ?? 0) + amount;
      const completed = progress >= challenge.target;

      await this.prisma.challengeProgress.upsert({
        where: { childId_challengeId: { childId, challengeId: challenge.id } },
        create: {
          childId,
          challengeId: challenge.id,
          progress,
          completed,
          completedAt: completed ? new Date() : null,
        },
        update: { progress, completed, completedAt: completed ? new Date() : undefined },
      });

      if (completed) completedNow.push(challenge.id);
    }
    return completedNow;
  }

  /** Claim rewards for a completed challenge. */
  async claim(childId: string, challengeId: string) {
    const progress = await this.prisma.challengeProgress.findUnique({
      where: { childId_challengeId: { childId, challengeId } },
    });
    if (!progress || !progress.completed) {
      throw new BadRequestException('Challenge not completed');
    }
    if (progress.rewardClaimed) {
      throw new BadRequestException('Reward already claimed');
    }
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.starsReward > 0) {
      await this.stars.earn(childId, challenge.starsReward, `challenge:${challenge.id}`, challenge.id);
    }
    if (challenge.xpReward > 0) {
      await this.xp.award(childId, {
        amount: challenge.xpReward,
        source: 'challenge',
        referenceId: challenge.id,
      });
    }
    await this.prisma.challengeProgress.update({
      where: { childId_challengeId: { childId, challengeId } },
      data: { rewardClaimed: true },
    });

    return {
      success: true,
      starsReward: challenge.starsReward,
      xpReward: challenge.xpReward,
    };
  }
}
