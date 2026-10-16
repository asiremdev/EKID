import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { StreaksService } from './streaks.service';

@ApiTags('streaks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('children/:childId/streak')
export class StreaksController {
  constructor(
    private readonly streaks: StreaksService,
    private readonly children: ChildrenService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current/best streak + next milestone' })
  async get(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.streaks.getStreak(childId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get streak day history' })
  async history(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.streaks.history(childId);
  }
}
