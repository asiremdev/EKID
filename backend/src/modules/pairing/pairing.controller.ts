import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentChild } from '../../common/decorators/current-child.decorator';
import { PairingService } from './pairing.service';
import { ProtectionService } from '../protection/protection.service';

@ApiTags('pairing')
@Controller()
export class PairingController {
  constructor(
    private readonly pairing: PairingService,
    private readonly protection: ProtectionService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('parents/me/pairing/code')
  @ApiOperation({ summary: 'Generate a 6-digit code to pair WLIDI-kids device' })
  createCode(@CurrentUser('id') parentId: string, @Body() body?: { childId?: string }) {
    return this.pairing.createCode(parentId, body?.childId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('parents/me/pairing/status')
  @ApiOperation({ summary: 'Check if child device is paired' })
  status(@CurrentUser('id') parentId: string, @Query('childId') childId?: string) {
    return this.pairing.getStatus(parentId, childId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('parents/me/child/installed-apps')
  @ApiOperation({ summary: 'Apps reported from the child device' })
  installedApps(@CurrentUser('id') parentId: string, @Query('childId') childId?: string) {
    return this.pairing.listInstalledAppsForParent(parentId, childId);
  }

  @Public()
  @Post('pairing/claim')
  @ApiOperation({ summary: 'WLIDI-kids: claim pairing code and receive device token' })
  claim(@Body() body: { code: string; deviceName?: string }) {
    return this.pairing.claimPairing(body.code, body.deviceName);
  }

  @ApiBearerAuth('device-token')
  @UseGuards(DeviceAuthGuard)
  @Post('device/apps/report')
  @ApiOperation({ summary: 'Child device: upload installed apps' })
  reportApps(
    @CurrentChild('id') childId: string,
    @Body() body: { apps: { packageName: string; appLabel?: string }[] },
  ) {
    return this.pairing.reportInstalledApps(childId, body.apps ?? []);
  }

  @ApiBearerAuth('device-token')
  @UseGuards(DeviceAuthGuard)
  @Get('device/sync')
  @ApiOperation({ summary: 'WLIDI-kids: pull lock config (poll every ~15 min)' })
  async deviceSync(@CurrentChild('id') childId: string, @CurrentChild('parentId') parentId: string) {
    await this.pairing.touchSync(childId);
    return this.protection.getSyncBundle(parentId, childId);
  }

  @ApiBearerAuth('device-token')
  @UseGuards(DeviceAuthGuard)
  @Post('device/protection/auto-unlock')
  @ApiOperation({ summary: 'WLIDI-kids: spend stars to unlock a blocked app' })
  deviceAutoUnlock(
    @CurrentChild('id') childId: string,
    @CurrentChild('parentId') parentId: string,
    @Body() body: { packageName: string; appLabel?: string },
  ) {
    return this.protection.autoUnlock(parentId, childId, body);
  }
}
