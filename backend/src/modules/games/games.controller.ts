import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GameId } from '@prisma/client';
import { DeviceAuthGuard } from '../../common/guards/device-auth.guard';
import { CurrentChild } from '../../common/decorators/current-child.decorator';
import { GamesService } from './games.service';

@ApiTags('games')
@Controller('device/games')
@UseGuards(DeviceAuthGuard)
@ApiBearerAuth('device-token')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
    @ApiOperation({ summary: 'Get the educative game for this child (50 levels, 5 worlds)' })
  state(@CurrentChild('id') childId: string) {
    return this.games.getGameState(childId);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete a game level and earn stars' })
  complete(
    @CurrentChild('id') childId: string,
    @Body() body: { gameId: GameId; level: number; score: number },
  ) {
    return this.games.completeLevel(childId, body.gameId, body.level, body.score);
  }
}
