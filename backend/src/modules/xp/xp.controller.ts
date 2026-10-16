import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { XpService } from './xp.service';

@ApiTags('xp')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('children/:childId/xp')
export class XpController {
  constructor(
    private readonly xp: XpService,
    private readonly children: ChildrenService,
  ) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get level + XP progress' })
  async progress(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.xp.getProgress(childId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get level-up history' })
  async history(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.xp.history(childId);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get recent XP events' })
  async events(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.xp.events(childId);
  }
}
