import { Global, Module } from '@nestjs/common';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';

@Global()
@Module({
  controllers: [XpController],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
