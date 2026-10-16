import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { StarsModule } from '../stars/stars.module';
import { AuthModule } from '../auth/auth.module';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';

@Module({
  imports: [StarsModule, AuthModule],
  controllers: [GamesController],
  providers: [GamesService, DeviceAuthGuard],
  exports: [GamesService],
})
export class GamesModule {}
