import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { RecordUsageDto } from './dto/usage.dto';
import { UnlocksService } from './unlocks.service';

@ApiTags('unlocks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('children/:childId/unlocks')
export class UnlocksController {
  constructor(
    private readonly unlocks: UnlocksService,
    private readonly children: ChildrenService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active app-time unlocks' })
  async active(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.unlocks.listActive(childId);
  }

  @Get('history')
  @ApiOperation({ summary: 'List unlock history' })
  async history(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.unlocks.history(childId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'List recorded usage history' })
  async usage(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.unlocks.usageHistory(childId);
  }

  @Post('usage')
  @ApiOperation({ summary: 'Record app usage minutes (synced from device)' })
  async recordUsage(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Body() dto: RecordUsageDto,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.unlocks.recordUsage(childId, dto.appPackage, dto.minutesUsed, dto.appLabel);
  }

  @Delete(':unlockId')
  @ApiOperation({ summary: 'Cancel an active unlock' })
  async cancel(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Param('unlockId') unlockId: string,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.unlocks.cancel(childId, unlockId);
  }
}
