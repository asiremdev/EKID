import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UnlockSource, UnlockStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChildrenService } from '../children/children.service';
import { StarsService } from '../stars/stars.service';
import { DEFAULT_REWARD_RULES } from './protection.constants';
import {
  AutoUnlockDto,
  RewardRuleDto,
  SetProtectionActiveDto,
  SyncProtectedAppsDto,
} from './dto/protection.dto';

export interface SyncBundle {
  child: {
    id: string;
    name: string;
    avatar: string | null;
    ageGroup: string;
    stars: number;
    xp: number;
    level: number;
    currentStreak: number;
    minutesEarned: number;
    minutesSpent: number;
  };
  protectionActive: boolean;
  onboardingComplete: boolean;
  protectedApps: { packageName: string; appLabel: string | null; enabled: boolean }[];
  rewardRules: {
    id: string;
    starsRequired: number;
    minutesGranted: number;
    isDefault: boolean;
  }[];
  defaultRule: { starsRequired: number; minutesGranted: number } | null;
  activeSessions: {
    id: string;
    packageName: string;
    appLabel: string | null;
    starsSpent: number;
    minutesGranted: number;
    startTime: string;
    endTime: string;
    status: string;
  }[];
}

@Injectable()
export class ProtectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
    private readonly stars: StarsService,
    private readonly audit: AuditService,
  ) {}

  /** Full config bundle for frontend + native sync. */
  async getSyncBundle(parentId: string, childId: string): Promise<SyncBundle> {
    const child = await this.children.assertOwnership(parentId, childId);

    // Single transaction — avoids Neon pool timeouts from parallel connections (P1001).
    const [apps, rules, activeSessions] = await this.prisma.$transaction(
      async (tx) => {
        const appsResult = await tx.protectedApp.findMany({
          where: { childId, enabled: true },
          orderBy: { packageName: 'asc' },
        });
        const rulesResult = await tx.rewardRule.findMany({
          where: { childId },
          orderBy: { sortOrder: 'asc' },
        });
        await tx.unlock.updateMany({
          where: { childId, status: UnlockStatus.ACTIVE, expiresAt: { lt: new Date() } },
          data: { status: UnlockStatus.EXPIRED },
        });
        const sessionsResult = await tx.unlock.findMany({
          where: { childId, status: UnlockStatus.ACTIVE },
          orderBy: { expiresAt: 'asc' },
        });
        return [appsResult, rulesResult, sessionsResult] as const;
      },
      { timeout: 20_000 },
    );

    const defaultRule = rules.find((r) => r.isDefault) ?? rules[0] ?? null;

    return {
      child: {
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        ageGroup: child.ageGroup,
        stars: child.stars,
        xp: child.xp,
        level: child.level,
        currentStreak: child.currentStreak,
        minutesEarned: child.minutesEarned,
        minutesSpent: child.minutesSpent,
      },
      protectionActive: child.protectionActive,
      onboardingComplete: child.onboardingComplete,
      protectedApps: apps.map((a) => ({
        packageName: a.packageName,
        appLabel: a.appLabel,
        enabled: a.enabled,
      })),
      rewardRules: rules.map((r) => ({
        id: r.id,
        starsRequired: r.starsRequired,
        minutesGranted: r.minutesGranted,
        isDefault: r.isDefault,
      })),
      defaultRule: defaultRule
        ? { starsRequired: defaultRule.starsRequired, minutesGranted: defaultRule.minutesGranted }
        : null,
      activeSessions: activeSessions.map((s) => ({
        id: s.id,
        packageName: s.appPackage,
        appLabel: s.appLabel,
        starsSpent: s.starsCost,
        minutesGranted: s.minutes,
        startTime: s.startedAt.toISOString(),
        endTime: s.expiresAt.toISOString(),
        status: s.status,
      })),
    };
  }

  async getSetupStatus(parentId: string, childId: string) {
    const child = await this.children.assertOwnership(parentId, childId);
    const [appCount, ruleCount, installedCount] = await Promise.all([
      this.prisma.protectedApp.count({ where: { childId, enabled: true } }),
      this.prisma.rewardRule.count({ where: { childId } }),
      this.prisma.childInstalledApp.count({ where: { childId } }),
    ]);

    let onboardingStep:
      | 'wait-child-setup'
      | 'select-apps'
      | 'reward-rules'
      | 'hide-app'
      | 'finish'
      | 'complete';
    if (child.onboardingComplete) {
      onboardingStep = 'complete';
    } else if (installedCount === 0) {
      onboardingStep = 'wait-child-setup';
    } else if (appCount === 0) {
      onboardingStep = 'select-apps';
    } else if (ruleCount === 0) {
      onboardingStep = 'reward-rules';
    } else {
      onboardingStep = 'hide-app';
    }

    const device = await this.prisma.childDevice.findUnique({ where: { childId } });

    return {
      hasChild: true,
      childId: child.id,
      onboardingComplete: child.onboardingComplete,
      protectionActive: child.protectionActive,
      protectedAppCount: appCount,
      rewardRuleCount: ruleCount,
      installedAppCount: installedCount,
      devicePaired: !!device?.isPaired,
      onboardingStep,
    };
  }

  async setProtectionActive(parentId: string, childId: string, dto: SetProtectionActiveDto) {
    await this.children.assertOwnership(parentId, childId);
    if (dto.active) {
      const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
      if (!child.onboardingComplete) {
        throw new BadRequestException('Complete onboarding before activating protection');
      }
    }
    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: { protectionActive: dto.active },
    });
    await this.audit.log({
      userId: parentId,
      action: dto.active ? 'protection.activate' : 'protection.deactivate',
      entity: 'Child',
      entityId: childId,
    });
    return { protectionActive: updated.protectionActive };
  }

  async syncProtectedApps(parentId: string, childId: string, dto: SyncProtectedAppsDto) {
    const child = await this.children.assertOwnership(parentId, childId);
    const now = new Date();
    const enabledCount = dto.apps.filter((a) => a.enabled !== false).length;
    await this.prisma.$transaction(async (tx) => {
      await tx.protectedApp.deleteMany({ where: { childId } });
      if (dto.apps.length > 0) {
        await tx.protectedApp.createMany({
          data: dto.apps.map((a) => ({
            childId,
            packageName: a.packageName,
            appLabel: a.appLabel ?? null,
            enabled: a.enabled ?? true,
            updatedAt: now,
          })),
        });
      }
      // Auto-enable blocking when parent saves protected apps (after onboarding).
      if (child.onboardingComplete && enabledCount > 0) {
        await tx.child.update({
          where: { id: childId },
          data: { protectionActive: true },
        });
      }
    });
    return this.prisma.protectedApp.findMany({ where: { childId } });
  }

  async getRewardRules(parentId: string, childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.prisma.rewardRule.findMany({ where: { childId }, orderBy: { sortOrder: 'asc' } });
  }

  async setRewardRules(parentId: string, childId: string, rules: RewardRuleDto[]) {
    await this.children.assertOwnership(parentId, childId);
    if (rules.length === 0) throw new BadRequestException('At least one reward rule is required');

    const defaultCount = rules.filter((r) => r.isDefault).length;
    if (defaultCount !== 1) {
      throw new BadRequestException('Exactly one rule must be marked as default for auto-unlock');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Clear FK reference before deleting rules.
      await tx.child.update({ where: { id: childId }, data: { defaultRuleId: null } });
      await tx.rewardRule.deleteMany({ where: { childId } });
      await tx.rewardRule.createMany({
        data: rules.map((r, i) => ({
          childId,
          starsRequired: r.starsRequired,
          minutesGranted: r.minutesGranted,
          sortOrder: r.sortOrder ?? i,
          isDefault: r.isDefault ?? false,
          updatedAt: now,
        })),
      });
      const defaultRule = await tx.rewardRule.findFirst({
        where: { childId, isDefault: true },
      });
      await tx.child.update({
        where: { id: childId },
        data: { defaultRuleId: defaultRule?.id ?? null },
      });
    });

    return this.getRewardRules(parentId, childId);
  }

  async seedDefaultRewardRules(childId: string) {
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

  async completeOnboarding(parentId: string, childId: string) {
    await this.children.assertOwnership(parentId, childId);
    const [appCount, ruleCount] = await Promise.all([
      this.prisma.protectedApp.count({ where: { childId, enabled: true } }),
      this.prisma.rewardRule.count({ where: { childId } }),
    ]);
    if (appCount === 0) throw new BadRequestException('Select at least one app to protect');
    if (ruleCount === 0) throw new BadRequestException('Configure reward rules first');

    const child = await this.prisma.child.update({
      where: { id: childId },
      data: { onboardingComplete: true, protectionActive: true },
    });
    await this.audit.log({
      userId: parentId,
      action: 'onboarding.complete',
      entity: 'Child',
      entityId: childId,
    });
    return { onboardingComplete: child.onboardingComplete };
  }

  /**
   * Automatic star spending when a protected app is opened.
   * Uses the default reward rule; rejects if insufficient stars or protection inactive.
   */
  async autoUnlock(parentId: string, childId: string, dto: AutoUnlockDto) {
    const child = await this.children.assertOwnership(parentId, childId);

    if (!child.protectionActive) {
      throw new ForbiddenException('Protection is not active');
    }
    if (!child.onboardingComplete) {
      throw new BadRequestException('Onboarding not complete');
    }

    const protectedApp = await this.prisma.protectedApp.findUnique({
      where: { childId_packageName: { childId, packageName: dto.packageName } },
    });
    if (!protectedApp?.enabled) {
      throw new BadRequestException('App is not in the protected list');
    }

    // If an active session exists for this app, extend/return it.
    const existing = await this.findActiveSession(childId, dto.packageName);
    if (existing) {
      return this.formatSessionResponse(existing, child.stars, false);
    }

    const rule =
      (child.defaultRuleId
        ? await this.prisma.rewardRule.findUnique({ where: { id: child.defaultRuleId } })
        : null) ??
      (await this.prisma.rewardRule.findFirst({ where: { childId, isDefault: true } }));

    if (!rule) throw new BadRequestException('No default reward rule configured');

    if (child.stars < rule.starsRequired) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STARS',
        message: 'Not enough stars',
        currentStars: child.stars,
        requiredStars: rule.starsRequired,
        packageName: dto.packageName,
      });
    }

    const result = await this.prisma.$transaction(async (client) => {
      const unlock = await client.unlock.create({
        data: {
          childId,
          appPackage: dto.packageName,
          appLabel: dto.appLabel ?? protectedApp.appLabel,
          minutes: rule.minutesGranted,
          starsCost: rule.starsRequired,
          source: UnlockSource.AUTO,
          status: UnlockStatus.ACTIVE,
          expiresAt: new Date(Date.now() + rule.minutesGranted * 60_000),
        },
      });

      const txResult = await this.stars.post(
        childId,
        {
          type: 'UNLOCK',
          amount: -rule.starsRequired,
          reason: `auto_unlock:${dto.packageName}`,
          referenceId: unlock.id,
          metadata: { appPackage: dto.packageName, minutes: rule.minutesGranted, source: 'AUTO' },
        },
        client,
      );

      await client.child.update({
        where: { id: childId },
        data: { minutesEarned: { increment: rule.minutesGranted } },
      });

      return { unlock, starsRemaining: txResult.balance };
    });

    await this.audit.log({
      userId: parentId,
      action: 'unlock.auto',
      entity: 'Unlock',
      entityId: result.unlock.id,
      metadata: {
        childId,
        packageName: dto.packageName,
        starsSpent: rule.starsRequired,
        minutesGranted: rule.minutesGranted,
      },
    });

    return this.formatSessionResponse(result.unlock, result.starsRemaining, true);
  }

  private async listActiveSessions(childId: string) {
    await this.prisma.unlock.updateMany({
      where: { childId, status: UnlockStatus.ACTIVE, expiresAt: { lt: new Date() } },
      data: { status: UnlockStatus.EXPIRED },
    });
    return this.prisma.unlock.findMany({
      where: { childId, status: UnlockStatus.ACTIVE },
      orderBy: { expiresAt: 'asc' },
    });
  }

  private async findActiveSession(childId: string, packageName: string) {
    await this.prisma.unlock.updateMany({
      where: {
        childId,
        appPackage: packageName,
        status: UnlockStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: UnlockStatus.EXPIRED },
    });
    return this.prisma.unlock.findFirst({
      where: { childId, appPackage: packageName, status: UnlockStatus.ACTIVE },
    });
  }

  private formatSessionResponse(
    unlock: {
      id: string;
      appPackage: string;
      appLabel: string | null;
      minutes: number;
      starsCost: number;
      startedAt: Date;
      expiresAt: Date;
      status: UnlockStatus;
    },
    starsRemaining: number,
    starsSpent: boolean,
  ) {
    return {
      session: {
        id: unlock.id,
        packageName: unlock.appPackage,
        appLabel: unlock.appLabel,
        starsSpent: unlock.starsCost,
        minutesGranted: unlock.minutes,
        startTime: unlock.startedAt.toISOString(),
        endTime: unlock.expiresAt.toISOString(),
        status: unlock.status,
        remainingSeconds: Math.max(
          0,
          Math.floor((unlock.expiresAt.getTime() - Date.now()) / 1000),
        ),
      },
      starsRemaining,
      starsSpent,
    };
  }

  /** Parent's first child when no id is chosen yet. */
  async getParentChild(parentId: string) {
    return this.prisma.child.findFirst({ where: { parentId }, orderBy: { createdAt: 'asc' } });
  }

  async assertSingleChild(parentId: string) {
    const child = await this.getParentChild(parentId);
    if (!child) throw new NotFoundException('No child profile yet');
    return child;
  }
}
