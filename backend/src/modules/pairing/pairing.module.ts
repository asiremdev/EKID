import { Module } from '@nestjs/common';
import { PairingController } from './pairing.controller';
import { PairingService } from './pairing.service';
import { ProtectionModule } from '../protection/protection.module';
import { ChildrenModule } from '../children/children.module';
import { AuthModule } from '../auth/auth.module';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';

@Module({
  imports: [ProtectionModule, ChildrenModule, AuthModule],
  controllers: [PairingController],
  providers: [PairingService, DeviceAuthGuard],
  exports: [PairingService],
})
export class PairingModule {}
