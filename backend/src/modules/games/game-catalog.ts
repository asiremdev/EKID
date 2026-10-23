import { AgeGroup, GameId } from '@prisma/client';

export const LEVELS_PER_GAME = 150;
export const LEVELS_PER_WORLD = 15;
export const WORLDS_PER_GAME = 10;

export type GameWorldDef = {
  id: number;
  title: string;
  mechanic: string;
  blurb: string;
};

function starsForWorlds(start: number): number[] {
  const out: number[] = [];
  for (let world = 0; world < WORLDS_PER_GAME; world++) {
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const base = start + Math.floor(world * 1.5) + Math.floor(i / 5);
      out.push(i === LEVELS_PER_WORLD - 1 ? base + 3 : base);
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
    { id: 6, title: 'Color Count', mechanic: 'count', blurb: 'Count the blooms of a color.' },
    { id: 7, title: 'Shade Sort', mechanic: 'shade', blurb: 'Order shades from light to dark.' },
    { id: 8, title: 'Memory Grove', mechanic: 'memory', blurb: 'Remember a color sequence.' },
    { id: 9, title: 'Rainbow Bridge', mechanic: 'bridge', blurb: 'Fill the missing color in a gradient.' },
    { id: 10, title: 'Garden Master', mechanic: 'mixed', blurb: 'All color skills combined.' },
  ],
  NUMBER_QUEST: [
    { id: 1, title: 'Count Cove', mechanic: 'count', blurb: 'Count the objects you see.' },
    { id: 2, title: 'Plus Peak', mechanic: 'add', blurb: 'Add the numbers together.' },
    { id: 3, title: 'Take-Away Trail', mechanic: 'subtract', blurb: 'Take some away and find what is left.' },
    { id: 4, title: 'Compare Castle', mechanic: 'compare', blurb: 'Bigger, smaller, and in order.' },
    { id: 5, title: 'Sequence Summit', mechanic: 'sequence', blurb: 'Find the missing number in the path.' },
    { id: 6, title: 'Double Dash', mechanic: 'double', blurb: 'Double the number.' },
    { id: 7, title: 'Number Bonds', mechanic: 'bond', blurb: 'Find the number that makes the total.' },
    { id: 8, title: 'Half Hut', mechanic: 'half', blurb: 'Find half of the number.' },
    { id: 9, title: 'Odd & Even', mechanic: 'parity', blurb: 'Tap odd or even.' },
    { id: 10, title: 'Math Mountain', mechanic: 'mixed', blurb: 'All math skills combined.' },
  ],
  WORD_LAB: [
    { id: 1, title: 'Picture Path', mechanic: 'match', blurb: 'Match the word to the picture.' },
    { id: 2, title: 'Letter Lab', mechanic: 'blank', blurb: 'Fill in the missing letter.' },
    { id: 3, title: 'Spell Studio', mechanic: 'spell', blurb: 'Spell the word from the letters.' },
    { id: 4, title: 'Rhyme Room', mechanic: 'rhyme', blurb: 'Find words that sound alike.' },
    { id: 5, title: 'Sentence Lab', mechanic: 'sentence', blurb: 'Build a tiny sentence that makes sense.' },
    { id: 6, title: 'Vowel Valley', mechanic: 'vowel', blurb: 'Pick the missing vowel.' },
    { id: 7, title: 'Word Families', mechanic: 'family', blurb: 'Match the word family.' },
    { id: 8, title: 'Opposites Orchard', mechanic: 'opposite', blurb: 'Find the opposite word.' },
    { id: 9, title: 'Punctuation Park', mechanic: 'punct', blurb: 'Choose the right punctuation.' },
    { id: 10, title: 'Story Studio', mechanic: 'mixed', blurb: 'All word skills combined.' },
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
    subtitle: '150 levels · 10 color worlds for little sprouts.',
    levels: LEVELS_PER_GAME,
    starsPerLevel: starsForWorlds(5),
    worlds: GAME_WORLDS.COLOR_GARDEN,
  },
  AGE_5_7: {
    gameId: GameId.NUMBER_QUEST,
    title: 'Number Quest',
    subtitle: '150 levels · 10 math worlds for curious kids.',
    levels: LEVELS_PER_GAME,
    starsPerLevel: starsForWorlds(6),
    worlds: GAME_WORLDS.NUMBER_QUEST,
  },
  AGE_7_10: {
    gameId: GameId.WORD_LAB,
    title: 'Word Lab',
    subtitle: '150 levels · 10 word worlds for word wizards.',
    levels: LEVELS_PER_GAME,
    starsPerLevel: starsForWorlds(7),
    worlds: GAME_WORLDS.WORD_LAB,
  },
};

export function worldForLevel(level: number) {
  const index = Math.min(WORLDS_PER_GAME - 1, Math.max(0, Math.floor((level - 1) / LEVELS_PER_WORLD)));
  return { index, world: index + 1, slot: ((level - 1) % LEVELS_PER_WORLD) + 1 };
}

export function minScoreForLevel(level: number) {
  const world = worldForLevel(level).world;
  return Math.min(80, 48 + world * 2);
}

export function gameForAge(ageGroup: AgeGroup) {
  return GAME_CATALOG[ageGroup];
}