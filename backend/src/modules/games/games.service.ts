import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GameId } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StarsService } from '../stars/stars.service';
import { gameForAge, minScoreForLevel, worldForLevel } from './game-catalog';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stars: StarsService,
  ) {}

  async getGameState(childId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const catalog = gameForAge(child.ageGroup);
    const progress = await this.prisma.gameLevelProgress.findMany({
      where: { childId, gameId: catalog.gameId },
      orderBy: { level: 'asc' },
    });

    const levelCount = catalog.levels;
    const levels = Array.from({ length: levelCount }, (_, i) => i + 1).map((level) => {
      const row = progress.find((p) => p.level === level);
      const unlocked = level === 1 || progress.some((p) => p.level === level - 1 && p.completed);
      const { world, slot } = worldForLevel(level);
      return {
        level,
        world,
        slot,
        unlocked,
        completed: row?.completed ?? false,
        starsReward: catalog.starsPerLevel[level - 1] ?? 5,
      };
    });

    return {
      child: { id: child.id, name: child.name, ageGroup: child.ageGroup, stars: child.stars },
      game: {
        gameId: catalog.gameId,
        title: catalog.title,
        subtitle: catalog.subtitle,
        worlds: catalog.worlds,
        levels,
      },
    };
  }

  async completeLevel(childId: string, gameId: GameId, level: number, score: number) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const catalog = gameForAge(child.ageGroup);
    if (catalog.gameId !== gameId) {
      throw new BadRequestException('This game does not match the child age range');
    }
    if (level < 1 || level > catalog.levels) {
      throw new BadRequestException(`Level must be between 1 and ${catalog.levels}`);
    }

    if (level > 1) {
      const prev = await this.prisma.gameLevelProgress.findUnique({
        where: { childId_gameId_level: { childId, gameId, level: level - 1 } },
      });
      if (!prev?.completed) throw new BadRequestException('Complete the previous level first');
    }

    const existing = await this.prisma.gameLevelProgress.findUnique({
      where: { childId_gameId_level: { childId, gameId, level } },
    });
    if (existing?.completed) {
      return { alreadyCompleted: true, starsEarned: 0, starsRemaining: child.stars };
    }

    const starsReward = catalog.starsPerLevel[level - 1] ?? 5;
    const minScore = minScoreForLevel(level);
    if (score < minScore) {
      throw new BadRequestException(`Score too low — need at least ${minScore}%`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.gameLevelProgress.upsert({
        where: { childId_gameId_level: { childId, gameId, level } },
        create: {
          childId,
          gameId,
          level,
          completed: true,
          starsEarned: starsReward,
          completedAt: new Date(),
        },
        update: {
          completed: true,
          starsEarned: starsReward,
          completedAt: new Date(),
        },
      });

      const txResult = await this.stars.post(
        childId,
        {
          type: 'EARN',
          amount: starsReward,
          reason: `game:${gameId}:level:${level}`,
          metadata: { gameId, level, score },
        },
        tx,
      );

      return { starsEarned: starsReward, starsRemaining: txResult.balance };
    });

    return { alreadyCompleted: false, ...result };
  }
}
