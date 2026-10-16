import { ChallengeType, PrismaClient, SubscriptionStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { cumulativeXpForLevel, levelTitle, MAX_LEVEL } from '../src/modules/xp/levels';
import { ACHIEVEMENTS } from './seed/achievements.seed';
import { ACTIVITIES } from './seed/activities.seed';

// Prefer the direct (non-pooled) URL for seeding — the pooled endpoint can be
// unreachable in some networks / during cold starts.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

async function seedLevelConfigs() {
  const rows = [];
  for (let level = 1; level <= MAX_LEVEL; level++) {
    rows.push({
      level,
      xpRequired: cumulativeXpForLevel(level),
      title: levelTitle(level),
      rewardJson: { stars: level % 5 === 0 ? level * 2 : 0 } as any,
    });
  }
  for (const row of rows) {
    await prisma.levelConfig.upsert({ where: { level: row.level }, create: row, update: row });
  }
  console.log(`✓ Seeded ${rows.length} level configs`);
}

async function seedAchievements() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { code: a.code }, create: a, update: a });
  }
  console.log(`✓ Seeded ${ACHIEVEMENTS.length} achievements`);
}

async function seedActivities() {
  for (const a of ACTIVITIES) {
    await prisma.activity.upsert({
      where: { slug: a.slug },
      create: a as any,
      update: a as any,
    });
  }
  console.log(`✓ Seeded ${ACTIVITIES.length} activities`);
}

async function seedChallenges() {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfDay = new Date(startOfDay.getTime() + 86_400_000);
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 86_400_000);

  const challenges = [
    {
      type: ChallengeType.DAILY,
      title: 'Daily Explorer',
      description: 'Complete 3 activities today',
      metric: 'activities',
      target: 3,
      starsReward: 20,
      xpReward: 40,
      startsAt: startOfDay,
      endsAt: endOfDay,
    },
    {
      type: ChallengeType.DAILY,
      title: 'Star Hunter',
      description: 'Earn 30 stars today',
      metric: 'stars',
      target: 30,
      starsReward: 15,
      xpReward: 30,
      startsAt: startOfDay,
      endsAt: endOfDay,
    },
    {
      type: ChallengeType.WEEKLY,
      title: 'Weekly Champion',
      description: 'Complete 20 activities this week',
      metric: 'activities',
      target: 20,
      starsReward: 100,
      xpReward: 200,
      startsAt: startOfDay,
      endsAt: endOfWeek,
    },
  ];

  for (const c of challenges) {
    const existing = await prisma.challenge.findFirst({
      where: { title: c.title, startsAt: c.startsAt },
    });
    if (existing) {
      await prisma.challenge.update({ where: { id: existing.id }, data: c });
    } else {
      await prisma.challenge.create({ data: c });
    }
  }
  console.log(`✓ Seeded ${challenges.length} challenges`);
}

async function seedUsers() {
  const adminPassword = await argon2.hash('Admin123!', { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: 'admin@kiddy.app' },
    update: {},
    create: {
      email: 'admin@kiddy.app',
      passwordHash: adminPassword,
      name: 'Kiddy Admin',
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.ACTIVE,
          trialEndsAt: new Date(Date.now() + 365 * 86_400_000),
          currentPeriodEnd: new Date(Date.now() + 365 * 86_400_000),
        },
      },
    },
  });

  const demoPassword = await argon2.hash('Parent123!', { type: argon2.argon2id });
  const parent = await prisma.user.upsert({
    where: { email: 'demo@kiddy.app' },
    update: {},
    create: {
      email: 'demo@kiddy.app',
      passwordHash: demoPassword,
      name: 'Demo Parent',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.TRIAL,
          trialEndsAt: new Date(Date.now() + 3 * 86_400_000),
        },
      },
    },
  });

  const existingChildren = await prisma.child.count({ where: { parentId: parent.id } });
  if (existingChildren === 0) {
    const child = await prisma.child.create({
      data: {
        parentId: parent.id,
        name: 'Mia',
        avatar: 'fox',
        ageGroup: 'AGE_5_7',
        onboardingComplete: true,
      },
    });
    await prisma.rewardRule.createMany({
      data: [
        { childId: child.id, starsRequired: 20, minutesGranted: 10, sortOrder: 0, isDefault: true },
        { childId: child.id, starsRequired: 40, minutesGranted: 20, sortOrder: 1, isDefault: false },
        { childId: child.id, starsRequired: 100, minutesGranted: 60, sortOrder: 2, isDefault: false },
      ],
    });
    const defaultRule = await prisma.rewardRule.findFirst({
      where: { childId: child.id, isDefault: true },
    });
    if (defaultRule) {
      await prisma.child.update({
        where: { id: child.id },
        data: { defaultRuleId: defaultRule.id },
      });
    }
  }
  console.log('✓ Seeded users (admin@kiddy.app / Admin123!, demo@kiddy.app / Parent123!)');
}

async function main() {
  console.log('🌱 Seeding Kiddy database...');
  await seedLevelConfigs();
  await seedAchievements();
  await seedActivities();
  await seedChallenges();
  await seedUsers();
  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
