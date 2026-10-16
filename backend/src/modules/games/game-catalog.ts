import { AgeGroup, GameId } from '@prisma/client';

export const LEVELS_PER_GAME = 50;
export const LEVELS_PER_WORLD = 10;

export type GameWorldDef = {
  id: number;
  title: string;
  mechanic: string;
  blurb: string;
};

function starsForWorlds(start: number): number[] {
  const out: number[] = [];
  for (let world = 0; world < 5; world++) {
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const base = start + world * 2 + Math.floor(i / 3);
      out.push(i === 9 ? base + 2 : base);
    }
  }
  return out;
}

export const GAME_WORLDS: Record<GameId, GameWorldDef[]> = {
  COLOR_GARDEN: [
    { id: 1, title: 'Match Meadow', mechanic: 'match', blurb: 'Tap the color that matches.' },
    { id: 2, title: 'Rainbow Row', mechanic: 'sort', blurb: 'Line colors up from warm to cool.' },
    { id: 3, title: 'Pattern Path', mechanic: 'pattern', blurb: 'What color comes next?' },
    { id: 4, title: 'Odd Bloom', mechanic: 'odd', blurb: 'Find the color that does not belong.' },
    { id: 5, title: 'Mix Garden', mechanic: 'mix', blurb: 'Mix colors and hunt matching blooms.' },
  ],
  NUMBER_QUEST: [
    { id: 1, title: 'Count Cove', mechanic: 'count', blurb: 'Count the objects you see.' },
    { id: 2, title: 'Plus Peak', mechanic: 'add', blurb: 'Add the numbers together.' },
    { id: 3, title: 'Take-Away Trail', mechanic: 'subtract', blurb: 'Take some away and find what is left.' },
    { id: 4, title: 'Compare Castle', mechanic: 'compare', blurb: 'Bigger, smaller, and in order.' },
    { id: 5, title: 'Sequence Summit', mechanic: 'sequence', blurb: 'Find the missing number in the path.' },
  ],
  WORD_LAB: [
    { id: 1, title: 'Picture Path', mechanic: 'match', blurb: 'Match the word to the picture.' },
    { id: 2, title: 'Letter Lab', mechanic: 'blank', blurb: 'Fill in the missing letter.' },
    { id: 3, title: 'Spell Studio', mechanic: 'spell', blurb: 'Spell the word from the letters.' },
    { id: 4, title: 'Rhyme Room', mechanic: 'rhyme', blurb: 'Find words that sound alike.' },
    { id: 5, title: 'Sentence Lab', mechanic: 'sentence', blurb: 'Build a tiny sentence that makes sense.' },
  ],
};

export const GAME_CATALOG: Record<
  AgeGroup,
  {
    gameId: GameId;
    title: string;
    subtitle: string;
    levels: number;
    starsPerLevel: number[];
    worlds: GameWorldDef[];
  }
> = {
  AGE_3_5: {
    gameId: GameId.COLOR_GARDEN,
    title: 'Color Garden',
    subtitle: '50 levels · 5 color worlds for little sprouts.',
    levels: LEVELS_PER_GAME,
    starsPerLevel: starsForWorlds(5),
    worlds: GAME_WORLDS.COLOR_GARDEN,
  },
  AGE_5_7: {
    gameId: GameId.NUMBER_QUEST,
    title: 'Number Quest',
    subtitle: '50 levels · 5 math worlds for curious kids.',
    levels: LEVELS_PER_GAME,
    starsPerLevel: starsForWorlds(6),
    worlds: GAME_WORLDS.NUMBER_QUEST,
  },
  AGE_7_10: {
    gameId: GameId.WORD_LAB,
    title: 'Word Lab',
    subtitle: '50 levels · 5 word worlds for word wizards.',
    levels: LEVELS_PER_GAME,
    starsPerLevel: starsForWorlds(7),
    worlds: GAME_WORLDS.WORD_LAB,
  },
};

export function worldForLevel(level: number) {
  const index = Math.min(4, Math.max(0, Math.floor((level - 1) / LEVELS_PER_WORLD)));
  return { index, world: index + 1, slot: ((level - 1) % LEVELS_PER_WORLD) + 1 };
}

export function minScoreForLevel(level: number) {
  const world = worldForLevel(level).world;
  if (world === 1) return 50;
  if (world === 2) return 55;
  if (world === 3) return 60;
  if (world === 4) return 65;
  return 70;
}

export function gameForAge(ageGroup: AgeGroup) {
  return GAME_CATALOG[ageGroup];
}
