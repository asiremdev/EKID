import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { levelForXp, levelProgress } from './levels';

export interface XpAward {
  amount: number;
  source: string;
  referenceId?: string;
}

@Injectable()
export class XpService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Award XP atomically: writes an XpEvent, updates the child's cached xp/level,
   * and records LevelHistory rows for every level gained. Returns level-up info.
   * Accepts an optional transaction client so it can compose with other awards.
   */
  async award(childId: string, award: XpAward, tx?: Prisma.TransactionClient) {
    const run = async (client: Prisma.TransactionClient) => {
      const child = await client.child.findUniqueOrThrow({ where: { id: childId } });
      const levelBefore = child.level;
      const newXp = child.xp + award.amount;
      const levelAfter = levelForXp(newXp);

      await client.xpEvent.create({
        data: {
          childId,
          amount: award.amount,
          source: award.source,
          referenceId: award.referenceId,
          levelBefore,
          levelAfter,
        },
      });

      await client.child.update({
        where: { id: childId },
        data: { xp: newXp, level: levelAfter },
      });

      if (levelAfter > levelBefore) {
        const rows = [];
        for (let lvl = levelBefore + 1; lvl <= levelAfter; lvl++) {
          rows.push({ childId, level: lvl });
        }
        await client.levelHistory.createMany({ data: rows });
      }

      return {
        xpAwarded: award.amount,
        totalXp: newXp,
        levelBefore,
        levelAfter,
        leveledUp: levelAfter > levelBefore,
      };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async getProgress(childId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    return levelProgress(child.xp);
  }

  history(childId: string) {
    return this.prisma.levelHistory.findMany({
      where: { childId },
      orderBy: { achievedAt: 'desc' },
    });
  }

  events(childId: string, take = 50) {
    return this.prisma.xpEvent.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
