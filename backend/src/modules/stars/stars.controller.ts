import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { UnlocksService } from '../unlocks/unlocks.service';
import {
  EarnStarsDto,
  SpendStarsDto,
  TransferStarsDto,
  UnlockAppTimeDto,
} from './dto/stars.dto';
import { StarsService } from './stars.service';

@ApiTags('stars')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('children/:childId/stars')
export class StarsController {
  constructor(
    private readonly stars: StarsService,
    private readonly unlocks: UnlocksService,
    private readonly children: ChildrenService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get a child star balance' })
  async balance(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.stars.getBalance(childId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List a child star ledger' })
  async transactions(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Query('take') take?: number,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.stars.transactions(childId, take ? Number(take) : 50);
  }

  @Post('earn')
  @ApiOperation({ summary: 'Manually credit stars (parent reward)' })
  async earn(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: EarnStarsDto,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.stars.earn(childId, dto.amount, dto.reason);
  }

  @Post('spend')
  @ApiOperation({ summary: 'Spend stars (redeem a reward)' })
  async spend(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: SpendStarsDto,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.stars.spend(childId, dto.amount, dto.reason);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer reward stars to a sibling' })
  async transfer(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: TransferStarsDto,
  ) {
    await this.children.assertOwnership(parentId, childId);
    await this.children.assertOwnership(parentId, dto.toChildId);
    return this.stars.transfer(childId, dto.toChildId, dto.amount, dto.reason ?? 'transfer');
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Spend stars to unlock app time' })
  async unlock(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: UnlockAppTimeDto,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.unlocks.unlockAppTime(childId, dto.appPackage, dto.minutes, dto.appLabel);
  }
}
