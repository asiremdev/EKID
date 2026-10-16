const MAP: Record<string, string> = {
  apple: '🍎', banana: '🍌', orange: '🍊', cherry: '🍒', grape: '🍇', strawberry: '🍓',
  cat: '🐱', dog: '🐶', cow: '🐮', pig: '🐷', lion: '🦁', elephant: '🐘', giraffe: '🦒',
  car: '🚗', bus: '🚌', truck: '🚚', plane: '✈️', boat: '⛵', train: '🚂',
  circle: '🔵', square: '🟥', triangle: '🔺', star: '⭐', heart: '❤️',
  meow: '🐱', woof: '🐶', moo: '🐮',
  jungle: '🌴',
};

/** Best-effort emoji for a content word; falls back to a star. */
export function emojiFor(word: string | number): string {
  const key = String(word).toLowerCase();
  return MAP[key] ?? '⭐';
}

/** Whether we have a real emoji (so renderers can decide to show text instead). */
export function hasEmoji(word: string | number): boolean {
  return String(word).toLowerCase() in MAP;
}

export function labelFor(word: string | number): string {
  const key = String(word).toLowerCase();
  if (key in MAP) return `${MAP[key]}`;
  return String(word);
}
