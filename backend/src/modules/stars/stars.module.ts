import { Global, Module } from '@nestjs/common';
import { StarsController } from './stars.controller';
import { StarsService } from './stars.service';

// UnlocksService, ChildrenService, PrismaService are global.
@Global()
@Module({
  controllers: [StarsController],
  providers: [StarsService],
  exports: [StarsService],
})
export class StarsModule {}
