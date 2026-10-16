import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';

// Stars/XP/Streaks/Achievements/Challenges/Analytics/Children are global modules.
@Module({
  controllers: [ActivitiesController, AttemptsController],
  providers: [ActivitiesService, AttemptsService],
  exports: [ActivitiesService, AttemptsService],
})
export class ActivitiesModule {}
