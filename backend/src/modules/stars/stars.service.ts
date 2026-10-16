import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface LedgerEntry {
  type: TransactionType;
  amount: number; // signed: + credit, - debit
  reason: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class StarsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The ONLY way balances change. Writes a signed ledger row and updates the
   * cached `child.stars` inside one transaction. Balances are never mutated
   * directly anywhere else in the codebase.
   */
  async post(childId: string, entry: LedgerEntry, tx?: Prisma.TransactionClient) {
    const run = async (client: Prisma.TransactionClient) => {
      const child = await client.child.findUniqueOrThrow({ where: { id: childId } });
      const balanceAfter = child.stars + entry.amount;
      if (balanceAfter < 0) {
        throw new BadRequestException('Insufficient stars');
      }

      const transaction = await client.starTransaction.create({
        data: {
          childId,
          type: entry.type,
          amount: entry.amount,
          balanceAfter,
          reason: entry.reason,
          referenceId: entry.referenceId,
          metadata: entry.metadata as any,
        },
      });

      await client.child.update({ where: { id: childId }, data: { stars: balanceAfter } });
      return { transaction, balance: balanceAfter };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  earn(childId: string, amount: number, reason: string, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Earn amount must be positive');
    return this.post(childId, { type: TransactionType.EARN, amount, reason, referenceId }, tx);
  }

  spend(childId: string, amount: number, reason: string, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Spend amount must be positive');
    return this.post(childId, { type: TransactionType.SPEND, amount: -amount, reason, referenceId }, tx);
  }

  /** Transfer stars from one sibling to another (atomic, both ledgers written). */
  async transfer(fromChildId: string, toChildId: string, amount: number, reason: string) {
    if (amount <= 0) throw new BadRequestException('Transfer amount must be positive');
    if (fromChildId === toChildId) throw new BadRequestException('Cannot transfer to the same child');

    return this.prisma.$transaction(async (client) => {
      await this.post(
        fromChildId,
        { type: TransactionType.TRANSFER_OUT, amount: -amount, reason, referenceId: toChildId },
        client,
      );
      const credit = await this.post(
        toChildId,
        { type: TransactionType.TRANSFER_IN, amount, reason, referenceId: fromChildId },
        client,
      );
      return { success: true, toBalance: credit.balance };
    });
  }

  async getBalance(childId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    return { balance: child.stars };
  }

  transactions(childId: string, take = 50) {
    return this.prisma.starTransaction.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
