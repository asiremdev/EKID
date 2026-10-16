import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly children: ChildrenService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform analytics overview (DAU/WAU, completion rates)' })
  overview(@Query('days') days?: number) {
    return this.analytics.overview(days ? Number(days) : 14);
  }

  @Get('children/:childId')
  @ApiOperation({ summary: 'Per-child analytics summary' })
  async child(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.analytics.childSummary(childId);
  }
}
