import { PrismaClient, AgeGroup } from '@prisma/client';
import * as F from './factories';
import type { GeneratedActivity } from './factories';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});

// Target pack sizes per the Phase 2B brief.
const TARGETS: Record<AgeGroup, number> = {
  AGE_3_5: 500,
  AGE_5_7: 700,
  AGE_7_10: 700,
};

/** Seeded RNG (mulberry32) for reproducible selection. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function candidatesFor(age: AgeGroup): GeneratedActivity[] {
  switch (age) {
    case 'AGE_3_5':
      return [
        ...F.genCounting(age, 1, 10),
        ...F.genTapObject(age, 1),
        ...F.genOddOneOut(age, 1),
        ...F.genMemory(age, 1),
        ...F.genShadowMatch(age, 1),
        ...F.genTracing(age, 1),
        ...F.genMatchPairs(age, 1),
        ...F.genSequence(age, 1),
        ...F.genMissingNumber(age, 1, 30),
        ...F.genAlphabetMC(age, 1),
        ...F.genMath(age, 1, ['add', 'sub'], 10),
      ];
    case 'AGE_5_7':
      return [
        ...F.genMissingLetter(age, 2),
        ...F.genMissingNumber(age, 2, 50),
        ...F.genMath(age, 2, ['add', 'sub'], 12),
        ...F.genMath(age, 2, ['mul'], 6),
        ...F.genSequence(age, 2),
        ...F.genCounting(age, 2, 10),
        ...F.genAlphabetMC(age, 2),
        ...F.genMaze(age, 2),
        ...F.genMemory(age, 2),
        ...F.genMatchPairs(age, 2),
        ...F.genCategorization(age, 2),
        ...F.genTapObject(age, 2),
        ...F.genOddOneOut(age, 2),
        ...F.genLogic(age, 2),
        ...F.genReading(age, 2),
        ...F.genGeography(age, 2),
        ...F.genScience(age, 2),
        ...F.genWordSearch(age, 2),
      ];
    case 'AGE_7_10':
      return [
        ...F.genMath(age, 3, ['mul', 'div'], 12),
        ...F.genMath(age, 3, ['add', 'sub'], 12),
        ...F.genReading(age, 3),
        ...F.genLogic(age, 3),
        ...F.genGeography(age, 3),
        ...F.genScience(age, 3),
        ...F.genCategorization(age, 3),
        ...F.genOddOneOut(age, 3),
        ...F.genSequence(age, 3),
        ...F.genMissingNumber(age, 3, 50),
        ...F.genTapObject(age, 3),
        ...F.genMemory(age, 3),
        ...F.genMaze(age, 3),
        ...F.genWordSearch(age, 3),
        ...F.genMatchPairs(age, 3),
        ...F.genAlphabetMC(age, 3),
        ...F.genCounting(age, 3, 10),
        ...F.genMath(age, 4, ['mul', 'div'], 12),
        ...F.genFractions(age, 4),
        ...F.genHistory(age, 4),
        ...F.genCrossword(age, 4),
      ];
    default:
      return [];
  }
}

function buildPack(age: AgeGroup, target: number, seed: number): GeneratedActivity[] {
  const raw = candidatesFor(age);
  // Dedupe by slug.
  const bySlug = new Map<string, GeneratedActivity>();
  for (const a of raw) if (!bySlug.has(a.slug)) bySlug.set(a.slug, a);
  const unique = shuffle([...bySlug.values()], rng(seed));
  if (unique.length < target) {
    console.warn(`⚠️  ${age}: only ${unique.length} unique candidates (target ${target}).`);
    return unique;
  }
  return unique.slice(0, target);
}

async function chunkedCreate(rows: GeneratedActivity[]) {
  const size = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size).map((a) => ({
      type: a.type,
      slug: a.slug,
      title: a.title,
      description: a.description,
      ageGroup: a.ageGroup,
      difficulty: a.difficulty,
      subject: a.subject,
      starsReward: a.starsReward,
      xpReward: a.xpReward,
      metadata: a.metadata as object,
    }));
    const res = await prisma.activity.createMany({ data: chunk, skipDuplicates: true });
    inserted += res.count;
  }
  return inserted;
}

async function main() {
  console.log('🏭 Generating activity packs...');
  let seed = 1337;
  let grandTotal = 0;
  for (const age of Object.keys(TARGETS) as AgeGroup[]) {
    const pack = buildPack(age, TARGETS[age], seed++);
    const inserted = await chunkedCreate(pack);
    grandTotal += inserted;
    console.log(`  ✓ ${age}: built ${pack.length}, inserted ${inserted} new`);
  }
  const total = await prisma.activity.count();
  console.log(`✅ Done. Inserted ${grandTotal} new this run. Total activities in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Generation failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
