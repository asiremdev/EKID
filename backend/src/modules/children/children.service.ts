import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_REWARD_RULES } from '../protection/protection.constants';
import { maxKidsForSubscription } from '../subscriptions/plans';
import { CreateChildDto, UpdateChildDto } from './dto/child.dto';

@Injectable()
export class ChildrenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Ensures the child belongs to the parent — used across all child-scoped modules. */
  async assertOwnership(parentId: string, childId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) throw new NotFoundException('Child not found');
    if (child.parentId !== parentId) throw new ForbiddenException('Not your child profile');
    return child;
  }

  async create(parentId: string, dto: CreateChildDto) {
    const kidsUsed = await this.prisma.child.count({ where: { parentId } });
    const subscription = await this.prisma.subscription.findUnique({ where: { userId: parentId } });
    const maxKids = maxKidsForSubscription(subscription);
    if (kidsUsed >= maxKids) {
      throw new ForbiddenException('Kid limit reached for this plan. Upgrade to add another child.');
    }
    const child = await this.prisma.child.create({
      data: { parentId, name: dto.name, avatar: dto.avatar, ageGroup: dto.ageGroup },
    });
    await this.seedDefaultRewardRules(child.id);
    await this.audit.log({
      userId: parentId,
      action: 'child.create',
      entity: 'Child',
      entityId: child.id,
    });
    return child;
  }

  async list(parentId: string) {
    return this.prisma.child.findMany({ where: { parentId }, orderBy: { createdAt: 'asc' } });
  }

  async getByParent(parentId: string) {
    return this.prisma.child.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' } });
  }

  async get(parentId: string, childId: string) {
    await this.assertOwnership(parentId, childId);
    return this.prisma.child.findUniqueOrThrow({
      where: { id: childId },
      include: {
        _count: {
          select: { attempts: true, achievements: true, unlocks: true },
        },
      },
    });
  }

  async update(parentId: string, childId: string, dto: UpdateChildDto) {
    await this.assertOwnership(parentId, childId);
    const child = await this.prisma.child.update({ where: { id: childId }, data: dto });
    await this.audit.log({
      userId: parentId,
      action: 'child.update',
      entity: 'Child',
      entityId: childId,
    });
    return child;
  }

  async remove(parentId: string, childId: string) {
    await this.assertOwnership(parentId, childId);
    await this.prisma.child.delete({ where: { id: childId } });
    await this.audit.log({
      userId: parentId,
      action: 'child.delete',
      entity: 'Child',
      entityId: childId,
    });
    return { success: true };
  }

  /** Aggregated dashboard stats for one child. */
  async stats(parentId: string, childId: string) {
    await this.assertOwnership(parentId, childId);
    const [child, completed, achievements] = await this.prisma.$transaction([
      this.prisma.child.findUniqueOrThrow({ where: { id: childId } }),
      this.prisma.activityAttempt.count({ where: { childId, status: 'COMPLETED' } }),
      this.prisma.childAchievement.count({ where: { childId, unlockedAt: { not: null } } }),
    ]);
    return {
      stars: child.stars,
      xp: child.xp,
      level: child.level,
      currentStreak: child.currentStreak,
      bestStreak: child.bestStreak,
      minutesEarned: child.minutesEarned,
      minutesSpent: child.minutesSpent,
      activitiesCompleted: completed,
      achievementsUnlocked: achievements,
    };
  }

  private async seedDefaultRewardRules(childId: string) {
    const existing = await this.prisma.rewardRule.count({ where: { childId } });
    if (existing > 0) return;
    const now = new Date();
    await this.prisma.rewardRule.createMany({
      data: DEFAULT_REWARD_RULES.map((r) => ({ childId, ...r, updatedAt: now })),
    });
    const defaultRule = await this.prisma.rewardRule.findFirst({
      where: { childId, isDefault: true },
    });
    if (defaultRule) {
      await this.prisma.child.update({
        where: { id: childId },
        data: { defaultRuleId: defaultRule.id },
      });
    }
  }
}
