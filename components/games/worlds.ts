import { ImageSourcePropType } from 'react-native';
import { IMAGES } from '../../constants/assets';

export const LEVELS_PER_WORLD = 10;

export const WORLD_ACCENTS = ['#4DB6AC', '#FF8A65', '#4FC3F7', '#FFD54F', '#7C6FF7'] as const;

export const GAME_WORLDS = {
  COLOR_GARDEN: [
    { title: 'Match Meadow', emoji: '🌷', skill: 'Color names', blurb: 'Tap the color that matches. Later: find it from the name only.' },
    { title: 'Rainbow Row', emoji: '🌈', skill: 'Warm to cool', blurb: 'Line colors up from warm to cool.' },
    { title: 'Pattern Path', emoji: '✨', skill: 'What comes next', blurb: 'Spot repeating color patterns.' },
    { title: 'Odd Bloom', emoji: '🌼', skill: 'Spot the difference', blurb: 'Find the odd color, then remember a color sequence.' },
    { title: 'Mix Garden', emoji: '🎨', skill: 'Mix & hunt', blurb: 'Mix two colors, then hunt every matching bloom.' },
  ],
  NUMBER_QUEST: [
    { title: 'Count Cove', emoji: '🔢', skill: 'Counting', blurb: 'Count the objects you see.' },
    { title: 'Plus Peak', emoji: '➕', skill: 'Adding', blurb: 'Add two numbers, then three.' },
    { title: 'Take-Away Trail', emoji: '➖', skill: 'Subtracting', blurb: 'Take some away and find what is left.' },
    { title: 'Compare Castle', emoji: '🏰', skill: 'Bigger & smaller', blurb: 'Compare, then tap numbers in order.' },
    { title: 'Sequence Summit', emoji: '⛰️', skill: 'Number paths', blurb: 'Find the missing number — by 1s, 2s, then 5s.' },
  ],
  WORD_LAB: [
    { title: 'Picture Path', emoji: '🖼️', skill: 'Word meaning', blurb: 'Match the word to the picture, then the first letter.' },
    { title: 'Letter Lab', emoji: '🔤', skill: 'Missing letters', blurb: 'Fill in the missing letter.' },
    { title: 'Spell Studio', emoji: '✏️', skill: 'Spelling', blurb: 'Spell the word from the letter tiles.' },
    { title: 'Rhyme Room', emoji: '🎵', skill: 'Rhymes', blurb: 'Find words that sound alike.' },
    { title: 'Sentence Lab', emoji: '💬', skill: 'Sentences', blurb: 'Build a tiny sentence that makes sense.' },
  ],
} as const;

export type GameWorldId = keyof typeof GAME_WORLDS;

export function worldIndexForLevel(level: number) {
  return Math.min(4, Math.max(0, Math.floor((level - 1) / LEVELS_PER_WORLD)));
}

export function worldMeta(gameId: GameWorldId, level: number) {
  const index = worldIndexForLevel(level);
  const world = GAME_WORLDS[gameId][index];
  return {
    index,
    number: index + 1,
    slot: ((level - 1) % LEVELS_PER_WORLD) + 1,
    accent: WORLD_ACCENTS[index],
    ...world,
  };
}

export function gameIdForAge(ageGroup?: string | null): GameWorldId {
  if (ageGroup === 'AGE_3_5') return 'COLOR_GARDEN';
  if (ageGroup === 'AGE_7_10') return 'WORD_LAB';
  return 'NUMBER_QUEST';
}

export function worldsArt(gameId: GameWorldId): ImageSourcePropType {
  if (gameId === 'COLOR_GARDEN') return IMAGES.colorGardenWorlds;
  if (gameId === 'WORD_LAB') return IMAGES.wordLabWorlds;
  return IMAGES.numberQuestWorlds;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function uniqueOptions(correct: number, extras: number[], size = 4) {
  const set = new Set<number>([correct, ...extras.filter((n) => n !== correct && n >= 0)]);
  let n = 1;
  while (set.size < size) {
    set.add(correct + n);
    set.add(Math.max(0, correct - n));
    n += 1;
  }
  return shuffle([...set]).slice(0, size);
}
