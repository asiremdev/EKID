import { Global, Module } from '@nestjs/common';
import { UnlocksController } from './unlocks.controller';
import { UnlocksService } from './unlocks.service';

// StarsService, AuditService, PrismaService and ChildrenService are global.
@Global()
@Module({
  controllers: [UnlocksController],
  providers: [UnlocksService],
  exports: [UnlocksService],
})
export class UnlocksModule {}
