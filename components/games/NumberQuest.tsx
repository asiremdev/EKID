import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { GameShell } from './GameShell';
import { Choice, FeedbackBurst, PulseTile, RoundDots, useRoundQuiz } from './PlayKit';
import { shuffle, uniqueOptions, worldIndexForLevel, worldMeta, worldsArt } from './worlds';

const EMOJIS = ['🍎', '⭐', '🐸', '🌸', '🎈', '🐠', '🦋', '🍪', '🍓', '🐰', '🍇', '🌻'];

interface Props {
  level: number;
  onComplete: (score: number) => void;
}

type ShellBits = { worldLabel: string; worldEmoji: string; accent: string; banner: ReturnType<typeof worldsArt> };

function slotOf(level: number) {
  return (level - 1) % 10;
}

export function NumberQuest({ level, onComplete }: Props) {
  const world = worldIndexForLevel(level);
  const meta = worldMeta('NUMBER_QUEST', level);
  const slot = slotOf(level);
  const shell: ShellBits = {
    worldLabel: `World ${meta.number} · ${meta.title}`,
    worldEmoji: meta.emoji,
    accent: meta.accent,
    banner: worldsArt('NUMBER_QUEST'),
  };

  if (world === 0) return <CountObjects key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 1 && slot >= 9) return <MakeTen key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 1 && slot >= 7) return <AddThree key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 1) return <AddNumbers key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 2 && slot >= 7) return <SubtractTwoStep key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 2) return <SubtractNumbers key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 3 && slot >= 6) return <OrderNumbers key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 3) return <CompareCastle key={level} slot={slot} onComplete={onComplete} {...shell} />;
  return <SequenceSummit key={level} slot={slot} onComplete={onComplete} {...shell} />;
}

function CountObjects({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const counts = [2 + slot, 3 + slot, Math.min(12, 4 + slot)];
    return counts.map((count) => {
      const emoji = EMOJIS[count % EMOJIS.length];
      return {
        count,
        items: Array.from({ length: count }, () => emoji),
        options: uniqueOptions(count, [count - 1, count + 1, count + 2, count - 2], 4),
      };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="How many?" subtitle="Count the objects, then tap the number" {...shell}>
      <View style={styles.row}>
        {quiz.current.items.map((e, i) => (
          <KText key={i} style={{ fontSize: 34 }}>
            {e}
          </KText>
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.count)} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function AddNumbers({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const max = slot < 4 ? 5 : slot < 8 ? 8 : 10;
    return Array.from({ length: 3 }, () => {
      const a = 1 + Math.floor(Math.random() * max);
      const b = 1 + Math.floor(Math.random() * Math.min(max, 12 - a));
      const sum = a + b;
      return { a, b, sum, options: uniqueOptions(sum, [sum - 1, sum + 1, a, b, sum + 2], 4) };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Add it up" subtitle="Pick the correct sum" {...shell}>
      <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
        <KText variant="display" color={WLIDI.coral}>
          {quiz.current.a} + {quiz.current.b}
        </KText>
        <KText variant="title" muted>
          = ?
        </KText>
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.sum)} color={WLIDI.mint} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function SubtractNumbers({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const max = slot < 5 ? 8 : 12;
    return Array.from({ length: 3 }, () => {
      const a = 4 + Math.floor(Math.random() * (max - 3));
      const b = 1 + Math.floor(Math.random() * Math.min(a - 1, 5 + Math.floor(slot / 2)));
      const diff = a - b;
      const emoji = EMOJIS[a % EMOJIS.length];
      return {
        a,
        b,
        diff,
        items: Array.from({ length: a }, (_, i) => ({ emoji, gone: i < b })),
        options: uniqueOptions(diff, [diff - 1, diff + 1, a, b], 4),
      };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Take away" subtitle="How many are left?" {...shell}>
      <KText variant="title" center color={WLIDI.coral}>
        {quiz.current.a} − {quiz.current.b}
      </KText>
      <View style={styles.row}>
        {quiz.current.items.map((item, i) => (
          <KText key={i} style={{ fontSize: 28, opacity: item.gone ? 0.22 : 1 }}>
            {item.emoji}
          </KText>
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.diff)} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function AddThree({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    return Array.from({ length: 3 }, () => {
      const a = 1 + Math.floor(Math.random() * 4);
      const b = 1 + Math.floor(Math.random() * 4);
      const c = 1 + Math.floor(Math.random() * 4);
      const sum = a + b + c;
      return { a, b, c, sum, options: uniqueOptions(sum, [sum - 1, sum + 1, a + b, b + c], 4) };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Triple add" subtitle="Add all three numbers" {...shell}>
      <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
        <KText variant="display" color={WLIDI.coral}>
          {quiz.current.a} + {quiz.current.b} + {quiz.current.c}
        </KText>
        <KText variant="title" muted>
          = ?
        </KText>
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.sum)} color={WLIDI.mint} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function MakeTen({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    return Array.from({ length: 3 }, () => {
      const a = 1 + (slot % 9);
      const need = 10 - a;
      return { a, need, options: uniqueOptions(need, [need - 1, need + 1, a, 10], 4) };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Make ten" subtitle="What number makes 10?" {...shell}>
      <PulseTile onPress={() => {}} color={WLIDI.peachLight} disabled style={{ alignSelf: 'center' }}>
        <KText variant="title" color={WLIDI.coral}>
          {quiz.current.a} + ? = 10
        </KText>
      </PulseTile>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.need)} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function SubtractTwoStep({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    return Array.from({ length: 3 }, () => {
      const a = 8 + Math.floor(Math.random() * 5);
      const b = 1 + Math.floor(Math.random() * 3);
      const c = 1 + Math.floor(Math.random() * 3);
      const diff = a - b - c;
      return { a, b, c, diff, options: uniqueOptions(diff, [diff - 1, diff + 1, a - b, a - c], 4) };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Two-step take-away" subtitle="Subtract both numbers, one after the other" {...shell}>
      <KText variant="title" center color={WLIDI.coral}>
        {quiz.current.a} − {quiz.current.b} − {quiz.current.c}
      </KText>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.diff)} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function CompareCastle({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {

  const rounds = useMemo(() => {
    return Array.from({ length: 3 }, () => {
      const left = 1 + Math.floor(Math.random() * (8 + slot));
      let right = 1 + Math.floor(Math.random() * (8 + slot));
      if (right === left) right += 1;
      const askBigger = slot % 2 === 0;
      const correct = askBigger ? Math.max(left, right) : Math.min(left, right);
      return { left, right, askBigger, correct };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell
      title={quiz.current.askBigger ? 'Which is bigger?' : 'Which is smaller?'}
      subtitle="Tap the number that wins"
      {...shell}
    >
      <View style={styles.row}>
        {[quiz.current.left, quiz.current.right].map((n, i) => (
          <Choice
            key={`${n}-${i}`}
            label={String(n)}
            size="lg"
            color={WLIDI.peachLight}
            onPress={() => quiz.pick(n === quiz.current.correct)}
          />
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function OrderNumbers({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const count = slot < 8 ? 4 : 5;
  const sequence = useMemo(() => {
    const start = 1 + slot;
    return shuffle(Array.from({ length: count }, (_, i) => start + i * (slot >= 9 ? 2 : 1)));
  }, [count, slot]);
  const [picked, setPicked] = useState<number[]>([]);
  const sorted = [...sequence].sort((a, b) => a - b);

  const tap = (n: number) => {
    if (picked.includes(n)) return;
    const next = [...picked, n];
    setPicked(next);
    if (next.length === sequence.length) {
      const matches = next.filter((v, i) => v === sorted[i]).length;
      onComplete(Math.round((matches / sequence.length) * 100));
    }
  };

  return (
    <GameShell title="Smallest to biggest" subtitle="Tap the numbers in order" {...shell}>
      <View style={styles.row}>
        {sequence.map((n) => (
          <Choice key={n} label={String(n)} used={picked.includes(n)} onPress={() => tap(n)} />
        ))}
      </View>
      <View style={[styles.row, { minHeight: 40 }]}>
        {picked.map((n, i) => (
          <KText key={i} variant="heading" color={WLIDI.starGold}>
            {n}
          </KText>
        ))}
      </View>
      <KButton label="Reset" variant="ghost" onPress={() => setPicked([])} style={{ marginTop: SPACING.lg }} />
    </GameShell>
  );
}

function SequenceSummit({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const step = slot < 4 ? 1 : slot < 8 ? 2 : 5;
  const rounds = useMemo(() => {
    return Array.from({ length: 3 }, () => {
      const start = 1 + Math.floor(Math.random() * 4);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const missingIndex = slot >= 5 ? 2 : 3;
      const correct = seq[missingIndex];
      return {
        seq,
        missingIndex,
        correct,
        options: uniqueOptions(correct, [correct - step, correct + step, correct + 1], 4),
      };
    });
  }, [slot, step]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Missing number" subtitle={`The path goes up by ${step}`} {...shell}>
      <View style={styles.row}>
        {quiz.current.seq.map((n, i) => (
          <View
            key={i}
            style={{
              width: 56,
              height: 56,
              borderRadius: RADIUS.lg,
              backgroundColor: i === quiz.current.missingIndex ? WLIDI.mint : WLIDI.peachLight,
              borderWidth: 2,
              borderColor: i === quiz.current.missingIndex ? WLIDI.teal : WLIDI.outline,
              borderStyle: i === quiz.current.missingIndex ? 'dashed' : 'solid',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KText variant="heading">{i === quiz.current.missingIndex ? '?' : n}</KText>
          </View>
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((n) => (
          <Choice key={n} label={String(n)} onPress={() => quiz.pick(n === quiz.current.correct)} />
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

const styles = {
  row: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
};
