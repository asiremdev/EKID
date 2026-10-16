import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProtectionService } from './protection.service';
import { ChildrenService } from '../children/children.service';
import {
  AutoUnlockDto,
  SetProtectionActiveDto,
  SetRewardRulesDto,
  SyncProtectedAppsDto,
} from './dto/protection.dto';

@ApiTags('protection')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class ProtectionController {
  constructor(
    private readonly protection: ProtectionService,
    private readonly children: ChildrenService,
  ) {}

  /** Resolve the parent's single child — enforces 1:1. */
  private async childIdFor(parentId: string, childId?: string) {
    if (childId) {
      await this.children.assertOwnership(parentId, childId);
      return childId;
    }
    const child = await this.protection.assertSingleChild(parentId);
    return child.id;
  }

  @Get('parents/me/child')
  @ApiOperation({ summary: "Get the parent's single child profile" })
  async myChild(@CurrentUser('id') parentId: string) {
    return this.protection.getParentChild(parentId);
  }

  @Get('parents/me/setup-status')
  @ApiOperation({ summary: 'Onboarding / setup progress for routing' })
  async setupStatus(@CurrentUser('id') parentId: string) {
    const child = await this.protection.getParentChild(parentId);
    if (!child) {
      return {
        hasChild: false,
        childId: null,
        onboardingComplete: false,
        protectionActive: false,
        protectedAppCount: 0,
        rewardRuleCount: 0,
        onboardingStep: 'create-child',
      };
    }
    return this.protection.getSetupStatus(parentId, child.id);
  }

  @Get('children/:childId/protection/sync')
  @ApiOperation({ summary: 'Full sync bundle for frontend + native layer' })
  sync(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    return this.protection.getSyncBundle(parentId, childId);
  }

  @Patch('children/:childId/protection/active')
  @ApiOperation({ summary: 'Master protection switch (ACTIVE / INACTIVE)' })
  setActive(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: SetProtectionActiveDto,
  ) {
    return this.protection.setProtectionActive(parentId, childId, dto);
  }

  @Put('children/:childId/protection/apps')
  @ApiOperation({ summary: 'Replace protected app selection (onboarding step 4)' })
  setApps(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: SyncProtectedAppsDto,
  ) {
    return this.protection.syncProtectedApps(parentId, childId, dto);
  }

  @Get('children/:childId/protection/reward-rules')
  @ApiOperation({ summary: 'List reward rules (stars → minutes tiers)' })
  getRules(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    return this.protection.getRewardRules(parentId, childId);
  }

  @Put('children/:childId/protection/reward-rules')
  @ApiOperation({ summary: 'Replace reward rules (onboarding step 5)' })
  setRules(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: SetRewardRulesDto,
  ) {
    return this.protection.setRewardRules(parentId, childId, dto.rules);
  }

  @Post('children/:childId/protection/complete-onboarding')
  @ApiOperation({ summary: 'Mark onboarding complete (step 6)' })
  completeOnboarding(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    return this.protection.completeOnboarding(parentId, childId);
  }

  @Post('children/:childId/protection/auto-unlock')
  @ApiOperation({ summary: 'Automatic star spend when opening a protected app' })
  autoUnlock(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: AutoUnlockDto,
  ) {
    return this.protection.autoUnlock(parentId, childId, dto);
  }
}
