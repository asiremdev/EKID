import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChildrenService } from '../children/children.service';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { AttemptsService } from './attempts.service';
import { CompleteAttemptDto } from './dto/attempt.dto';

@ApiTags('attempts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Controller('children/:childId/attempts')
export class AttemptsController {
  constructor(
    private readonly attempts: AttemptsService,
    private readonly children: ChildrenService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List a child activity attempts' })
  async list(@CurrentUser('id') parentId: string, @Param('childId') childId: string) {
    await this.children.assertOwnership(parentId, childId);
    return this.attempts.listForChild(childId);
  }

  @Post('activities/:activityId/start')
  @ApiOperation({ summary: 'Start an activity attempt' })
  async start(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Param('activityId') activityId: string,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.attempts.start(childId, activityId);
  }

  @Post(':attemptId/complete')
  @ApiOperation({ summary: 'Complete an attempt and grant rewards' })
  async complete(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: CompleteAttemptDto,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.attempts.complete(childId, attemptId, dto);
  }

  @Post(':attemptId/abandon')
  @ApiOperation({ summary: 'Abandon an attempt' })
  async abandon(
    @CurrentUser('id') parentId: string,
    @Param('childId') childId: string,
    @Param('attemptId') attemptId: string,
  ) {
    await this.children.assertOwnership(parentId, childId);
    return this.attempts.abandon(childId, attemptId);
  }
}
