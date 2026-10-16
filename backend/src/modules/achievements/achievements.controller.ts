import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@Controller()
export class AchievementsController {
  constructor(
    private readonly achievements: AchievementsService,
    private readonly children: ChildrenService,
  ) {}

  @Public()
  @Get('achievements')
  @ApiOperation({ summary: 'List the achievement catalog' })
  catalog() {
    return this.achievements.listCatalog();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('children/:childId/achievements')
  @ApiOperation({ summary: 'List a child achievements with progress' })
  async forChild(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.achievements.listForChild(childId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('children/:childId/achievements/evaluate')
  @ApiOperation({ summary: 'Re-evaluate achievements for a child' })
  async evaluate(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.achievements.evaluate(childId);
  }
}
