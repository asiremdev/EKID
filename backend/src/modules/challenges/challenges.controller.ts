import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChildrenService } from '../children/children.service';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto, UpdateChallengeDto } from './dto/challenge.dto';

@ApiTags('challenges')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class ChallengesController {
  constructor(
    private readonly challenges: ChallengesService,
    private readonly children: ChildrenService,
  ) {}

  @Get('challenges')
  @ApiOperation({ summary: 'List active challenges' })
  active() {
    return this.challenges.listActive();
  }

  @Get('children/:childId/challenges')
  @ApiOperation({ summary: 'List active challenges with a child progress' })
  async forChild(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.challenges.listForChild(childId);
  }

  @Post('children/:childId/challenges/:challengeId/claim')
  @ApiOperation({ summary: 'Claim a completed challenge reward' })
  async claim(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Param('challengeId') challengeId: string,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.challenges.claim(childId, challengeId);
  }

  // ─── Admin-only management ───────────────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/challenges')
  @ApiOperation({ summary: '[admin] Create a challenge' })
  create(@Body() dto: CreateChallengeDto) {
    return this.challenges.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/challenges/:id')
  @ApiOperation({ summary: '[admin] Update a challenge' })
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.challenges.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/challenges/:id')
  @ApiOperation({ summary: '[admin] Delete a challenge' })
  remove(@Param('id') id: string) {
    return this.challenges.remove(id);
  }
}
