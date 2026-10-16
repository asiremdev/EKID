import { Global, Module } from '@nestjs/common';
import { ProtectionController } from './protection.controller';
import { ProtectionService } from './protection.service';
import { ChildrenModule } from '../children/children.module';
import { StarsModule } from '../stars/stars.module';

@Global()
@Module({
  imports: [ChildrenModule, StarsModule],
  controllers: [ProtectionController],
  providers: [ProtectionService],
  exports: [ProtectionService],
})
export class ProtectionModule {}
