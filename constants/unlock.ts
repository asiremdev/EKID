/** How many stars one minute of screen-time costs. */
export const STARS_PER_MINUTE = 2;

/** Selectable unlock durations (minutes). */
export const UNLOCK_DURATIONS = [10, 20, 30, 60];

export function starCost(minutes: number): number {
  return minutes * STARS_PER_MINUTE;
}

/** Friendly emoji for well-known apps. */
export function appEmoji(packageName: string, appName?: string): string {
  const p = packageName.toLowerCase();
  const n = (appName ?? '').toLowerCase();
  if (p.includes('youtube') || n.includes('youtube')) return '▶️';
  if (p.includes('tiktok') || n.includes('tiktok')) return '🎵';
  if (p.includes('roblox') || n.includes('roblox')) return '🎮';
  if (p.includes('chrome') || n.includes('chrome')) return '🌐';
  if (p.includes('instagram')) return '📸';
  if (p.includes('whatsapp')) return '💬';
  if (p.includes('game')) return '🎮';
  return '📱';
}
