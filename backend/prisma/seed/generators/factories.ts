import { ActivityType, AgeGroup } from '@prisma/client';
import {
  ALPHABET,
  ANIMALS,
  CAPITALS,
  CATEGORIES,
  FRUITS,
  HISTORY_QA,
  READING_SENTENCES,
  SCIENCE_QA,
  SHAPES,
  SIMPLE_WORDS,
  VEHICLES,
} from './pools';

export interface GeneratedActivity {
  type: ActivityType;
  slug: string;
  title: string;
  description: string;
  ageGroup: AgeGroup;
  difficulty: number;
  subject: string;
  starsReward: number;
  xpReward: number;
  metadata: Record<string, unknown>;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function reward(difficulty: number) {
  return { starsReward: 4 + difficulty * 2, xpReward: 8 + difficulty * 4 };
}

function choiceMeta(question: string, correct: string, distractors: string[]) {
  const options = [correct, ...distractors];
  // Deterministic-ish shuffle by rotating based on question length.
  const rot = question.length % options.length;
  const rotated = [...options.slice(rot), ...options.slice(0, rot)];
  return { question, options: rotated, answerIndex: rotated.indexOf(correct) };
}

function numericDistractors(answer: number, n = 2): string[] {
  const set = new Set<number>();
  let delta = 1;
  while (set.size < n) {
    if (answer + delta >= 0) set.add(answer + delta);
    if (set.size < n && answer - delta >= 0 && answer - delta !== answer) set.add(answer - delta);
    delta++;
  }
  return Array.from(set).map(String);
}

// ─── Producers ───────────────────────────────────────────────────────────────

export function genMath(age: AgeGroup, difficulty: number, ops: ('add' | 'sub' | 'mul' | 'div')[], max: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (const op of ops) {
    for (let a = op === 'mul' || op === 'div' ? 1 : 0; a <= max; a++) {
      for (let b = op === 'mul' || op === 'div' ? 1 : 0; b <= max; b++) {
        let q: string;
        let ans: number;
        if (op === 'add') {
          q = `${a} + ${b} = ?`;
          ans = a + b;
        } else if (op === 'sub') {
          if (b > a) continue;
          q = `${a} - ${b} = ?`;
          ans = a - b;
        } else if (op === 'mul') {
          q = `${a} × ${b} = ?`;
          ans = a * b;
        } else {
          const product = a * b;
          q = `${product} ÷ ${a} = ?`;
          ans = b;
        }
        out.push({
          type: 'math',
          slug: `${age}-math-${op}-${a}-${b}`,
          title: 'Math Challenge',
          description: q,
          ageGroup: age,
          difficulty,
          subject: 'math',
          ...r,
          metadata: choiceMeta(q, String(ans), numericDistractors(ans)),
        });
      }
    }
  }
  return out;
}

export function genCounting(age: AgeGroup, difficulty: number, maxCount: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const targets = ['star', 'apple', 'cat', 'car', 'heart'];
  for (const t of targets) {
    for (let c = 1; c <= maxCount; c++) {
      const opts = [c - 1, c, c + 1].filter((x) => x >= 1);
      out.push({
        type: 'counting',
        slug: `${age}-count-${t}-${c}`,
        title: 'Count Them!',
        description: `How many ${t}s do you see?`,
        ageGroup: age,
        difficulty,
        subject: 'counting',
        ...r,
        metadata: { count: c, target: t, options: opts, answerIndex: opts.indexOf(c) },
      });
    }
  }
  return out;
}

export function genTapObject(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const cats = Object.entries(CATEGORIES);
  for (const [name, items] of cats) {
    const others = cats.filter(([n]) => n !== name).flatMap(([, v]) => v);
    for (const target of items) {
      for (let count = 2; count <= 4; count++) {
        const distractors = others.slice(0, 2);
        out.push({
          type: 'tap_object',
          slug: `${age}-tap-${target}-${count}`,
          title: `Tap the ${target}s`,
          description: `Tap all the ${target}s`,
          ageGroup: age,
          difficulty,
          subject: 'counting',
          ...r,
          metadata: { target, count, distractors },
        });
      }
    }
  }
  return out;
}

export function genOddOneOut(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const cats = Object.entries(CATEGORIES);
  for (const [name, items] of cats) {
    const others = cats.filter(([n]) => n !== name).flatMap(([, v]) => v);
    for (let i = 0; i + 2 < items.length; i++) {
      const trio = items.slice(i, i + 3);
      for (let d = 0; d < Math.min(3, others.length); d++) {
        const odd = others[d];
        const arr = [...trio, odd];
        out.push({
          type: 'odd_one_out',
          slug: `${age}-odd-${name}-${i}-${d}`,
          title: 'Odd One Out',
          description: 'Which one does not belong?',
          ageGroup: age,
          difficulty,
          subject: 'logic',
          ...r,
          metadata: { items: arr, answerIndex: 3 },
        });
      }
    }
  }
  return out;
}

export function genMemory(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (const [name, items] of Object.entries(CATEGORIES)) {
    for (let i = 0; i + 3 <= items.length; i++) {
      const cards = items.slice(i, i + 3);
      out.push({
        type: 'memory',
        slug: `${age}-memory-${name}-${i}`,
        title: 'Memory Match',
        description: 'Find the matching cards',
        ageGroup: age,
        difficulty,
        subject: 'memory',
        ...r,
        metadata: { cards, pairs: cards.length },
      });
    }
  }
  return out;
}

export function genShadowMatch(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (const [name, items] of Object.entries(CATEGORIES)) {
    for (let i = 0; i + 3 <= items.length; i++) {
      const objects = items.slice(i, i + 3);
      out.push({
        type: 'shadow_match',
        slug: `${age}-shadow-${name}-${i}`,
        title: 'Match the Shadow',
        description: 'Match each object to its shadow',
        ageGroup: age,
        difficulty,
        subject: 'logic',
        ...r,
        metadata: { objects },
      });
    }
  }
  return out;
}

export function genTracing(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (const letter of ALPHABET) {
    out.push({
      type: 'letter_tracing',
      slug: `${age}-trace-letter-${letter}`,
      title: `Trace the Letter ${letter}`,
      description: `Follow the path to trace ${letter}`,
      ageGroup: age,
      difficulty,
      subject: 'reading',
      ...r,
      metadata: { letter, strokes: [] },
    });
  }
  for (let n = 0; n <= 20; n++) {
    out.push({
      type: 'number_tracing',
      slug: `${age}-trace-number-${n}`,
      title: `Trace the Number ${n}`,
      description: `Follow the path to trace ${n}`,
      ageGroup: age,
      difficulty,
      subject: 'math',
      ...r,
      metadata: { number: n, strokes: [] },
    });
  }
  return out;
}

export function genMatchPairs(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  // Uppercase ↔ lowercase letter pairs in sets of 3.
  for (let i = 0; i + 3 <= ALPHABET.length; i += 3) {
    const letters = ALPHABET.slice(i, i + 3);
    out.push({
      type: 'match_pairs',
      slug: `${age}-match-letters-${i}`,
      title: 'Match Capitals',
      description: 'Match uppercase to lowercase',
      ageGroup: age,
      difficulty,
      subject: 'reading',
      ...r,
      metadata: { pairs: letters.map((l) => [l, l.toLowerCase()]) },
    });
  }
  return out;
}

export function genMissingLetter(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  for (const word of SIMPLE_WORDS) {
    const idx = [...word].findIndex((c) => vowels.includes(c));
    if (idx === -1) continue;
    const masked = word.slice(0, idx) + '_' + word.slice(idx + 1);
    const correct = word[idx];
    const distractors = vowels.filter((v) => v !== correct).slice(0, 2);
    const options = [correct, ...distractors];
    const rot = word.length % options.length;
    const rotated = [...options.slice(rot), ...options.slice(0, rot)];
    out.push({
      type: 'missing_letter',
      slug: `${age}-missingletter-${slugify(word)}`,
      title: 'Missing Letter',
      description: `Complete the word ${masked}`,
      ageGroup: age,
      difficulty,
      subject: 'reading',
      ...r,
      metadata: { word, masked, options: rotated, answerIndex: rotated.indexOf(correct) },
    });
  }
  return out;
}

export function genMissingNumber(age: AgeGroup, difficulty: number, max: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (let a = 1; a <= max; a++) {
    out.push({
      type: 'missing_number',
      slug: `${age}-missingnumber-${a}`,
      title: 'Missing Number',
      description: `What is missing? ${a}, _, ${a + 2}`,
      ageGroup: age,
      difficulty,
      subject: 'math',
      ...r,
      metadata: { sequence: [a, null, a + 2], answer: a + 1 },
    });
  }
  return out;
}

export function genSequence(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const pools = [ANIMALS, FRUITS, VEHICLES, SHAPES];
  for (const pool of pools) {
    for (let i = 0; i + 1 < pool.length; i++) {
      const a = pool[i];
      const b = pool[i + 1];
      const seq = [a, b, a, b];
      out.push({
        type: 'sequence',
        slug: `${age}-seq-${slugify(a)}-${slugify(b)}`,
        title: 'What Comes Next?',
        description: 'Continue the pattern',
        ageGroup: age,
        difficulty,
        subject: 'logic',
        ...r,
        metadata: { sequence: seq, options: [a, b], answerIndex: 0 },
      });
    }
  }
  return out;
}

export function genCategorization(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const cats = Object.entries(CATEGORIES);
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const [n1, i1] = cats[i];
      const [n2, i2] = cats[j];
      const items: Record<string, string> = {};
      i1.slice(0, 2).forEach((it) => (items[it] = n1));
      i2.slice(0, 2).forEach((it) => (items[it] = n2));
      out.push({
        type: 'categorization',
        slug: `${age}-sort-${n1}-${n2}`,
        title: `Sort: ${n1} vs ${n2}`,
        description: 'Put each item in the right group',
        ageGroup: age,
        difficulty,
        subject: 'logic',
        ...r,
        metadata: { groups: [n1, n2], items },
      });
    }
  }
  return out;
}

export function genReading(age: AgeGroup, difficulty: number) {
  const r = reward(difficulty);
  return READING_SENTENCES.map((s, i) => ({
    type: 'reading' as ActivityType,
    slug: `${age}-reading-${i}`,
    title: 'Reading Time',
    description: 'Read the short sentence',
    ageGroup: age,
    difficulty,
    subject: 'reading',
    ...r,
    metadata: { text: s.text, question: s.question, answer: s.answer },
  }));
}

export function genGeography(age: AgeGroup, difficulty: number) {
  const r = reward(difficulty);
  return CAPITALS.map((c, i) => {
    const distractors = CAPITALS.filter((x) => x.capital !== c.capital)
      .slice(i, i + 2)
      .map((x) => x.capital);
    const fill = distractors.length === 2 ? distractors : [...distractors, CAPITALS[(i + 3) % CAPITALS.length].capital];
    const q = `Capital of ${c.country}?`;
    return {
      type: 'geography' as ActivityType,
      slug: `${age}-geo-${slugify(c.country)}`,
      title: 'World Capitals',
      description: q,
      ageGroup: age,
      difficulty,
      subject: 'geography',
      ...r,
      metadata: choiceMeta(q, c.capital, fill),
    };
  });
}

export function genScience(age: AgeGroup, difficulty: number) {
  const r = reward(difficulty);
  return SCIENCE_QA.map((s, i) => ({
    type: 'science' as ActivityType,
    slug: `${age}-science-${i}`,
    title: 'Science Quiz',
    description: s.q,
    ageGroup: age,
    difficulty,
    subject: 'science',
    ...r,
    metadata: choiceMeta(s.q, s.a, s.d.slice(0, 2)),
  }));
}

export function genHistory(age: AgeGroup, difficulty: number) {
  const r = reward(difficulty);
  return HISTORY_QA.map((s, i) => ({
    type: 'history' as ActivityType,
    slug: `${age}-history-${i}`,
    title: 'History Quiz',
    description: s.q,
    ageGroup: age,
    difficulty,
    subject: 'history',
    ...r,
    metadata: choiceMeta(s.q, s.a, s.d.slice(0, 2)),
  }));
}

export function genFractions(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  const fracs = ['1/2', '1/3', '1/4', '2/3', '3/4', '1/5'];
  for (let i = 0; i < fracs.length; i++) {
    for (let j = 0; j < fracs.length; j++) {
      if (i === j) continue;
      const q = `Which is bigger: ${fracs[i]} or ${fracs[j]}?`;
      const fracValue = (f: string) => {
        const [n, d] = f.split('/').map(Number);
        return n / d;
      };
      const correct = fracValue(fracs[i]) > fracValue(fracs[j]) ? fracs[i] : fracs[j];
      out.push({
        type: 'fractions',
        slug: `${age}-frac-${i}-${j}`,
        title: 'Fractions',
        description: q,
        ageGroup: age,
        difficulty,
        subject: 'fractions',
        ...r,
        metadata: { question: q, options: [fracs[i], fracs[j]], answerIndex: correct === fracs[i] ? 0 : 1 },
      });
    }
  }
  return out;
}

export function genLogic(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (let i = 1; i <= 20; i++) {
    const q = `What comes next? ${i}, ${i * 2}, ${i * 3}, ?`;
    const ans = i * 4;
    out.push({
      type: 'logic',
      slug: `${age}-logic-mult-${i}`,
      title: 'Logic Puzzle',
      description: q,
      ageGroup: age,
      difficulty,
      subject: 'logic',
      ...r,
      metadata: choiceMeta(q, String(ans), numericDistractors(ans)),
    });
  }
  return out;
}

export function genMaze(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (let grid = 4; grid <= 7; grid++) {
    for (let v = 0; v < 8; v++) {
      out.push({
        type: 'maze',
        slug: `${age}-maze-${grid}-${v}`,
        title: 'Find the Exit',
        description: 'Guide the fox to the exit',
        ageGroup: age,
        difficulty,
        subject: 'logic',
        ...r,
        metadata: { grid, start: [0, 0], end: [grid - 1, grid - 1], seed: v },
      });
    }
  }
  return out;
}

export function genWordSearch(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (let i = 0; i + 4 <= SIMPLE_WORDS.length; i += 2) {
    const words = SIMPLE_WORDS.slice(i, i + 4);
    out.push({
      type: 'word_search',
      slug: `${age}-wordsearch-${i}`,
      title: 'Word Search',
      description: 'Find the hidden words',
      ageGroup: age,
      difficulty,
      subject: 'reading',
      ...r,
      metadata: { size: 8, words },
    });
  }
  return out;
}

export function genCrossword(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (let i = 0; i + 1 < SIMPLE_WORDS.length; i += 2) {
    const across = SIMPLE_WORDS[i];
    const down = SIMPLE_WORDS[i + 1];
    out.push({
      type: 'crossword',
      slug: `${age}-crossword-${i}`,
      title: 'Mini Crossword',
      description: 'Fill in the crossword',
      ageGroup: age,
      difficulty,
      subject: 'reading',
      ...r,
      metadata: { across: { 1: across }, down: { 1: down }, size: 3 },
    });
  }
  return out;
}

export function genAlphabetMC(age: AgeGroup, difficulty: number) {
  const out: GeneratedActivity[] = [];
  const r = reward(difficulty);
  for (let i = 0; i < ALPHABET.length - 1; i++) {
    const q = `Which letter comes after ${ALPHABET[i]}?`;
    const correct = ALPHABET[i + 1];
    const distractors = [ALPHABET[(i + 3) % 26], ALPHABET[(i + 5) % 26]];
    out.push({
      type: 'multiple_choice',
      slug: `${age}-alpha-after-${ALPHABET[i]}`,
      title: 'Alphabet',
      description: q,
      ageGroup: age,
      difficulty,
      subject: 'reading',
      ...r,
      metadata: choiceMeta(q, correct, distractors),
    });
  }
  return out;
}
