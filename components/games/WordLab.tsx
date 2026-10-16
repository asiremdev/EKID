import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { GameShell } from './GameShell';
import { Choice, FeedbackBurst, PulseTile, RoundDots, useRoundQuiz } from './PlayKit';
import { shuffle, worldIndexForLevel, worldMeta, worldsArt } from './worlds';

const WORDS = [
  { word: 'CAT', emoji: '🐱', hint: 'Meow', rhyme: 'HAT' },
  { word: 'DOG', emoji: '🐶', hint: 'Barks', rhyme: 'FROG' },
  { word: 'SUN', emoji: '☀️', hint: 'Bright sky', rhyme: 'FUN' },
  { word: 'HAT', emoji: '🎩', hint: 'On your head', rhyme: 'CAT' },
  { word: 'BED', emoji: '🛏️', hint: 'You sleep here', rhyme: 'RED' },
  { word: 'PEN', emoji: '🖊️', hint: 'You write with it', rhyme: 'HEN' },
  { word: 'CUP', emoji: '🥤', hint: 'You drink from it', rhyme: 'PUP' },
  { word: 'BUS', emoji: '🚌', hint: 'A big ride', rhyme: 'PLUS' },
  { word: 'MAP', emoji: '🗺️', hint: 'Shows the way', rhyme: 'CAP' },
  { word: 'FOX', emoji: '🦊', hint: 'Orange and clever', rhyme: 'BOX' },
  { word: 'TREE', emoji: '🌳', hint: 'Has leaves', rhyme: 'BEE' },
  { word: 'BOOK', emoji: '📚', hint: 'You read it', rhyme: 'LOOK' },
  { word: 'FISH', emoji: '🐠', hint: 'Swims', rhyme: 'DISH' },
  { word: 'MOON', emoji: '🌙', hint: 'Night light', rhyme: 'SPOON' },
  { word: 'STAR', emoji: '⭐', hint: 'Twinkles', rhyme: 'CAR' },
  { word: 'BIRD', emoji: '🐦', hint: 'It flies', rhyme: 'WORD' },
  { word: 'FROG', emoji: '🐸', hint: 'Hops', rhyme: 'DOG' },
  { word: 'CAKE', emoji: '🎂', hint: 'Birthday treat', rhyme: 'LAKE' },
  { word: 'SHIP', emoji: '🚢', hint: 'Sails on water', rhyme: 'DIP' },
  { word: 'RAIN', emoji: '🌧️', hint: 'Falls from clouds', rhyme: 'TRAIN' },
  { word: 'HOUSE', emoji: '🏠', hint: 'You live here', rhyme: 'MOUSE' },
  { word: 'BALL', emoji: '⚽', hint: 'You bounce it', rhyme: 'TALL' },
  { word: 'BELL', emoji: '🔔', hint: 'It rings', rhyme: 'SHELL' },
  { word: 'SMILE', emoji: '😊', hint: 'Happy face', rhyme: 'MILE' },
  { word: 'STAR', emoji: '⭐', hint: 'Twinkles at night', rhyme: 'CAR' },
];

const SENTENCES = [
  { words: ['THE', 'CAT', 'SAT'], emoji: '🐱', hint: 'A pet took a rest' },
  { words: ['I', 'SEE', 'SUN'], emoji: '☀️', hint: 'Look at the sky' },
  { words: ['A', 'BIG', 'DOG'], emoji: '🐶', hint: 'A large pet' },
  { words: ['THE', 'RED', 'BUS'], emoji: '🚌', hint: 'A colorful ride' },
  { words: ['WE', 'LIKE', 'CAKE'], emoji: '🎂', hint: 'A sweet treat' },
  { words: ['THE', 'FISH', 'SWIM'], emoji: '🐠', hint: 'In the water' },
  { words: ['A', 'TALL', 'TREE'], emoji: '🌳', hint: 'It grows high' },
  { words: ['I', 'READ', 'BOOKS'], emoji: '📚', hint: 'A reading habit' },
  { words: ['THE', 'MOON', 'GLOWS'], emoji: '🌙', hint: 'At night' },
  { words: ['BIRDS', 'CAN', 'FLY'], emoji: '🐦', hint: 'Up in the sky' },
];

const CATEGORIES = [
  { id: 'animals', label: 'Animals', emoji: '🐾', words: ['CAT', 'DOG', 'FOX', 'FISH', 'BIRD', 'FROG'] },
  { id: 'sky', label: 'Sky', emoji: '🌤️', words: ['SUN', 'MOON', 'STAR', 'RAIN'] },
  { id: 'things', label: 'Things', emoji: '🎒', words: ['HAT', 'BED', 'PEN', 'CUP', 'BUS', 'MAP', 'BOOK', 'SHIP', 'HOUSE', 'BALL', 'BELL'] },
  { id: 'treats', label: 'Treats', emoji: '🎂', words: ['CAKE'] },
  { id: 'nature', label: 'Nature', emoji: '🌿', words: ['TREE'] },
];

const LETTERS = 'AEIOUBCDFGHJKLMNPQRSTVWXYZ'.split('');

interface Props {
  level: number;
  onComplete: (score: number) => void;
}

type ShellBits = { worldLabel: string; worldEmoji: string; accent: string; banner: ReturnType<typeof worldsArt> };

function slotOf(level: number) {
  return (level - 1) % 10;
}

function wordPool(slot: number) {
  return WORDS.slice(0, slot < 5 ? 12 : WORDS.length);
}

export function WordLab({ level, onComplete }: Props) {
  const world = worldIndexForLevel(level);
  const meta = worldMeta('WORD_LAB', level);
  const slot = slotOf(level);
  const shell: ShellBits = {
    worldLabel: `World ${meta.number} · ${meta.title}`,
    worldEmoji: meta.emoji,
    accent: meta.accent,
    banner: worldsArt('WORD_LAB'),
  };

  if (world === 0 && slot >= 7) return <FirstLetter key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 0) return <WordPictureMatch key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 1) return <FillBlank key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 2) return <SpellWord key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 3) return <RhymeRoom key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (slot >= 7) return <CategorySort key={level} slot={slot} onComplete={onComplete} {...shell} />;
  return <SentenceLab key={level} slot={slot} onComplete={onComplete} {...shell} />;
}

function WordPictureMatch({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const pool = wordPool(slot);
    return shuffle(pool)
      .slice(0, 3)
      .map((target) => ({
        target,
        options: shuffle([target, ...shuffle(pool.filter((w) => w.word !== target.word)).slice(0, 3)]),
      }));
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Word match" subtitle="Which word fits the picture?" {...shell}>
      <KText style={{ fontSize: 72, textAlign: 'center' }}>{quiz.current.target.emoji}</KText>
      <KText variant="caption" muted center>
        {quiz.current.target.hint}
      </KText>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
        {quiz.current.options.map((w) => (
          <Pressable
            key={w.word}
            onPress={() => quiz.pick(w.word === quiz.current.target.word)}
            style={styles.wordRow}
          >
            <KText variant="heading" style={{ letterSpacing: 3 }}>
              {w.word}
            </KText>
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function FillBlank({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const pool = wordPool(slot).filter((w) => w.word.length >= 3);
    return shuffle(pool)
      .slice(0, 3)
      .map((item) => {
        const letters = item.word.split('');
        const blankIndex = 1 + (slot % Math.max(1, letters.length - 2));
        const missing = letters[blankIndex];
        return {
          item,
          letters,
          blankIndex,
          missing,
          options: shuffle([missing, ...shuffle(LETTERS.filter((c) => c !== missing)).slice(0, 3)]),
        };
      });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Fill the blank" subtitle={quiz.current.item.hint} {...shell}>
      <KText style={{ fontSize: 56, textAlign: 'center' }}>{quiz.current.item.emoji}</KText>
      <View style={styles.row}>
        {quiz.current.letters.map((ch, i) => (
          <View
            key={i}
            style={[
              styles.letterBox,
              { backgroundColor: i === quiz.current.blankIndex ? WLIDI.mintDark : WLIDI.cream },
            ]}
          >
            <KText variant="title">{i === quiz.current.blankIndex ? '_' : ch}</KText>
          </View>
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((letter) => (
          <Choice key={letter} label={letter} color={WLIDI.mint} onPress={() => quiz.pick(letter === quiz.current.missing)} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function SpellWord({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const item = useMemo(() => {
    const pool = WORDS.filter((w) => (slot < 5 ? w.word.length <= 4 : w.word.length <= 6));
    return pool[slot % pool.length];
  }, [slot]);
  const decoyCount = slot < 4 ? 2 : 4;
  const pool = useMemo(
    () => shuffle([...item.word.split(''), ...shuffle(LETTERS.filter((c) => !item.word.includes(c))).slice(0, decoyCount)]),
    [item.word, decoyCount],
  );
  const [built, setBuilt] = useState<string[]>([]);
  const [used, setUsed] = useState<Set<number>>(new Set());

  const tapLetter = (letter: string, index: number) => {
    if (used.has(index) || built.length >= item.word.length) return;
    const nextBuilt = [...built, letter];
    const nextUsed = new Set(used);
    nextUsed.add(index);
    setBuilt(nextBuilt);
    setUsed(nextUsed);
    if (nextBuilt.length === item.word.length) {
      const score = nextBuilt.join('') === item.word ? 100 : Math.max(40, Math.round((letterOverlap(nextBuilt.join(''), item.word) / item.word.length) * 100));
      setTimeout(() => onComplete(score), 280);
    }
  };

  return (
    <GameShell title="Spell it" subtitle={`Hint: ${item.hint}`} {...shell}>
      <KText style={{ fontSize: 64, textAlign: 'center' }}>{item.emoji}</KText>
      <View style={styles.row}>
        {Array.from({ length: item.word.length }).map((_, i) => (
          <View key={i} style={[styles.letterBox, { borderColor: WLIDI.teal }]}>
            <KText variant="heading">{built[i] ?? ''}</KText>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {pool.map((letter, i) => (
          <Choice key={`${letter}-${i}`} label={letter} used={used.has(i)} color={WLIDI.skyBlue} onPress={() => tapLetter(letter, i)} />
        ))}
      </View>
      <KButton
        label="Clear"
        variant="ghost"
        onPress={() => {
          setBuilt([]);
          setUsed(new Set());
        }}
        style={{ marginTop: SPACING.lg }}
      />
    </GameShell>
  );
}

function letterOverlap(a: string, b: string) {
  let n = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) n += 1;
  return n;
}

function RhymeRoom({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const pool = WORDS.filter((w) => w.rhyme.length <= (slot < 6 ? 4 : 8));
    return shuffle(pool)
      .slice(0, 3)
      .map((target) => {
        const decoys = shuffle(WORDS.filter((w) => w.word !== target.word && w.rhyme !== target.rhyme)).slice(0, 3);
        const correct = { word: target.rhyme, isCorrect: true };
        return {
          target,
          options: shuffle([correct, ...decoys.map((d) => ({ word: d.word, isCorrect: false }))]),
        };
      });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Rhyme time" subtitle={`What rhymes with ${quiz.current.target.word}?`} {...shell}>
      <KText style={{ fontSize: 56, textAlign: 'center' }}>{quiz.current.target.emoji}</KText>
      <KText variant="title" center color={WLIDI.teal}>
        {quiz.current.target.word}
      </KText>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
        {quiz.current.options.map((opt) => (
          <Pressable key={opt.word} onPress={() => quiz.pick(opt.isCorrect)} style={styles.wordRow}>
            <KText variant="heading" style={{ letterSpacing: 2 }}>
              {opt.word}
            </KText>
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function FirstLetter({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const pool = wordPool(slot);
    return shuffle(pool)
      .slice(0, 3)
      .map((target) => {
        const first = target.word[0];
        return {
          target,
          first,
          options: shuffle([first, ...shuffle(LETTERS.filter((c) => c !== first)).slice(0, 3)]),
        };
      });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="First sound" subtitle="What letter does this word start with?" {...shell}>
      <KText style={{ fontSize: 72, textAlign: 'center' }}>{quiz.current.target.emoji}</KText>
      <KText variant="caption" muted center>
        {quiz.current.target.hint}
      </KText>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((letter) => (
          <PulseTile key={letter} onPress={() => quiz.pick(letter === quiz.current.first)} color={WLIDI.mint}>
            <KText variant="heading">{letter}</KText>
          </PulseTile>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function CategorySort({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const usable = CATEGORIES.filter((c) => c.words.length > 0);
    return Array.from({ length: 3 }, () => {
      const category = usable[Math.floor(Math.random() * usable.length)];
      const word = WORDS.find((w) => category.words.includes(w.word)) ?? WORDS[0];
      const decoys = shuffle(usable.filter((c) => c.id !== category.id)).slice(0, 2);
      return {
        word,
        category,
        options: shuffle([category, ...decoys]),
      };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Sort the word" subtitle="Which group does this belong to?" {...shell}>
      <KText style={{ fontSize: 64, textAlign: 'center' }}>{quiz.current.word.emoji}</KText>
      <KText variant="title" center>
        {quiz.current.word.word}
      </KText>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
        {quiz.current.options.map((opt) => (
          <Pressable key={opt.id} onPress={() => quiz.pick(opt.id === quiz.current.category.id)} style={styles.wordRow}>
            <KText variant="heading">
              {opt.emoji}  {opt.label}
            </KText>
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function SentenceLab({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const item = useMemo(() => SENTENCES[slot % SENTENCES.length], [slot]);
  const tiles = useMemo(() => shuffle(item.words), [item.words]);
  const [built, setBuilt] = useState<string[]>([]);
  const [used, setUsed] = useState<Set<number>>(new Set());

  const tap = (word: string, index: number) => {
    if (used.has(index)) return;
    const nextBuilt = [...built, word];
    const nextUsed = new Set(used);
    nextUsed.add(index);
    setBuilt(nextBuilt);
    setUsed(nextUsed);
    if (nextBuilt.length === item.words.length) {
      const ok = nextBuilt.join(' ') === item.words.join(' ');
      setTimeout(() => onComplete(ok ? 100 : 55), 280);
    }
  };

  return (
    <GameShell title="Build the sentence" subtitle={item.hint} {...shell}>
      <KText style={{ fontSize: 56, textAlign: 'center' }}>{item.emoji}</KText>
      <View style={styles.row}>
        {item.words.map((_, i) => (
          <View key={i} style={[styles.letterBox, { minWidth: 72, paddingHorizontal: SPACING.sm }]}>
            <KText variant="label">{built[i] ?? '—'}</KText>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {tiles.map((word, i) => (
          <Choice key={`${word}-${i}`} label={word} used={used.has(i)} color={WLIDI.peachLight} onPress={() => tap(word, i)} />
        ))}
      </View>
      <KButton
        label="Clear"
        variant="ghost"
        onPress={() => {
          setBuilt([]);
          setUsed(new Set());
        }}
        style={{ marginTop: SPACING.lg }}
      />
    </GameShell>
  );
}

const styles = {
  row: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  letterBox: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: WLIDI.white,
    borderWidth: 2,
    borderColor: WLIDI.outline,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  wordRow: {
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: WLIDI.cream,
    borderWidth: 2,
    borderColor: WLIDI.outline,
    alignItems: 'center' as const,
  },
};
