/**
 * Level curve (levels 1..100).
 *
 * `cumulativeXpForLevel(L)` = total XP required to *reach* level L.
 * Level 1 starts at 0 XP; each level needs progressively more XP.
 */
export const MAX_LEVEL = 100;

export function cumulativeXpForLevel(level: number): number {
  const l = Math.max(1, Math.min(level, MAX_LEVEL));
  // Smooth quadratic curve: 0, 100, 260, 480, ...
  const n = l - 1;
  return Math.round(50 * n * n + 50 * n);
}

export function levelForXp(totalXp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXp >= cumulativeXpForLevel(level + 1)) {
    level++;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  currentLevelXp: number; // XP into the current level
  nextLevelXp: number; // XP span of the current level
  xpToNext: number;
  progress: number; // 0..1
  isMax: boolean;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const base = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  const span = Math.max(1, next - base);
  const into = totalXp - base;
  const isMax = level >= MAX_LEVEL;
  return {
    level,
    totalXp,
    currentLevelXp: into,
    nextLevelXp: span,
    xpToNext: isMax ? 0 : next - totalXp,
    progress: isMax ? 1 : Math.min(1, into / span),
    isMax,
  };
}

/** Title bands for levels — used for LevelConfig + UI. */
export function levelTitle(level: number): string {
  if (level >= 90) return 'Legend';
  if (level >= 70) return 'Champion';
  if (level >= 50) return 'Master';
  if (level >= 30) return 'Explorer';
  if (level >= 15) return 'Adventurer';
  if (level >= 5) return 'Learner';
  return 'Beginner';
}
