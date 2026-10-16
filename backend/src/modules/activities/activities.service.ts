import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateActivityDto) {
    return this.prisma.activity.create({ data: dto as any });
  }

  async findAll(query: QueryActivityDto) {
    const where: any = { isActive: true };
    if (query.type) where.type = query.type;
    if (query.ageGroup) where.ageGroup = query.ageGroup;
    if (query.subject) where.subject = query.subject;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  findOne(id: string) {
    return this.prisma.activity.findUniqueOrThrow({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.activity.findUniqueOrThrow({ where: { slug } });
  }

  update(id: string, dto: UpdateActivityDto) {
    return this.prisma.activity.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.activity.delete({ where: { id } });
  }

  /** Soft toggle visibility without deleting content. */
  setActive(id: string, isActive: boolean) {
    return this.prisma.activity.update({ where: { id }, data: { isActive } });
  }
}
