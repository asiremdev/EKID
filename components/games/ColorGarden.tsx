import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { GameShell } from './GameShell';
import { ColorBlob, FeedbackBurst, MemoryFlash, PulseTile, RoundDots, useRoundQuiz } from './PlayKit';
import { shuffle, worldIndexForLevel, worldMeta, worldsArt } from './worlds';

const PALETTE = [
  { name: 'Red', hex: '#FF6B6B' },
  { name: 'Orange', hex: '#FF9F43' },
  { name: 'Yellow', hex: '#FFD93D' },
  { name: 'Green', hex: '#4CAF88' },
  { name: 'Blue', hex: '#4FC3F7' },
  { name: 'Purple', hex: '#7C6FF7' },
  { name: 'Pink', hex: '#F48FB1' },
  { name: 'Teal', hex: '#26A69A' },
];

const MIXES = [
  { a: 'Red', b: 'Yellow', result: 'Orange' },
  { a: 'Yellow', b: 'Red', result: 'Orange' },
  { a: 'Blue', b: 'Yellow', result: 'Green' },
  { a: 'Yellow', b: 'Blue', result: 'Green' },
  { a: 'Red', b: 'Blue', result: 'Purple' },
  { a: 'Blue', b: 'Red', result: 'Purple' },
];

interface Props {
  level: number;
  onComplete: (score: number) => void;
}

function color(name: string) {
  return PALETTE.find((p) => p.name === name)!;
}

function worldSlot(level: number) {
  return (level - 1) % 10;
}

type ShellBits = { worldLabel: string; worldEmoji: string; accent: string; banner: ReturnType<typeof worldsArt> };

export function ColorGarden({ level, onComplete }: Props) {
  const world = worldIndexForLevel(level);
  const meta = worldMeta('COLOR_GARDEN', level);
  const slot = worldSlot(level);
  const shell: ShellBits = {
    worldLabel: `World ${meta.number} · ${meta.title}`,
    worldEmoji: meta.emoji,
    accent: meta.accent,
    banner: worldsArt('COLOR_GARDEN'),
  };

  if (world === 0 && slot >= 7) return <NameMatch key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 0) return <MatchColor key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 1) return <SortColors key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 2) return <ColorPattern key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 3 && slot >= 7) return <ColorMemory key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (world === 3) return <OddBloom key={level} slot={slot} onComplete={onComplete} {...shell} />;
  if (slot >= 7) return <ColorHunt key={level} slot={slot} onComplete={onComplete} {...shell} />;
  return <MixColors key={level} slot={slot} onComplete={onComplete} {...shell} />;
}

function MatchColor({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const roundsCount = 2 + Math.floor(slot / 3);
  const optionCount = slot < 4 ? 3 : 4;
  const paletteSize = slot < 6 ? 4 : 6;
  const rounds = useMemo(
    () =>
      shuffle(PALETTE.slice(0, paletteSize))
        .slice(0, roundsCount)
        .map((target) => ({
          target,
          options: shuffle([
            target,
            ...shuffle(PALETTE.filter((p) => p.name !== target.name)).slice(0, optionCount - 1),
          ]),
        })),
    [roundsCount, optionCount, paletteSize],
  );
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Match the color" subtitle="Tap the circle that matches" {...shell}>
      <View style={{ alignItems: 'center' }}>
        <ColorBlob hex={quiz.current.target.hex} size={108} />
        <KText variant="caption" muted center style={{ marginTop: SPACING.sm }}>
          {quiz.current.target.name}
        </KText>
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((c) => (
          <Pressable key={c.name} onPress={() => quiz.pick(c.name === quiz.current.target.name)}>
            <ColorBlob hex={c.hex} size={68} />
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function SortColors({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const colorCount = Math.min(6, 3 + Math.floor(slot / 3));
  const targetOrder = useMemo(
    () => ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'].slice(0, colorCount),
    [colorCount],
  );
  const [order, setOrder] = useState(() => shuffle(targetOrder));
  const [selected, setSelected] = useState<number | null>(null);

  const swap = (index: number) => {
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[index]] = [next[index], next[selected]];
    setOrder(next);
    setSelected(null);
  };

  const check = () => {
    const matches = order.filter((name, i) => name === targetOrder[i]).length;
    onComplete(Math.round((matches / targetOrder.length) * 100));
  };

  return (
    <GameShell title="Rainbow row" subtitle="Tap two rows to swap · warm → cool" {...shell}>
      <View style={{ gap: SPACING.sm }}>
        {order.map((name, i) => {
          const c = color(name);
          return (
            <Pressable
              key={`${name}-${i}`}
              onPress={() => swap(i)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: RADIUS.xl,
                backgroundColor: selected === i ? WLIDI.mintDark : WLIDI.cream,
                borderWidth: 2,
                borderColor: selected === i ? WLIDI.teal : WLIDI.outline,
              }}
            >
              <ColorBlob hex={c.hex} size={36} selected={selected === i} />
              <KText variant="heading" style={{ marginLeft: SPACING.md }}>
                {name}
              </KText>
            </Pressable>
          );
        })}
      </View>
      <KButton label="Check order" onPress={check} style={{ marginTop: SPACING.xl }} />
    </GameShell>
  );
}

function ColorPattern({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const count = slot < 4 ? 2 : 3;
    return Array.from({ length: count }, () => {
      const colors = shuffle(PALETTE.slice(0, slot < 5 ? 4 : 6));
      const a = colors[0];
      const b = colors[1];
      const c = colors[2] ?? colors[0];
      const sequence =
        slot < 3 ? [a, b, a, b, a] : slot < 7 ? [a, b, c, a, b, c] : [a, a, b, b, a, a, b];
      const missingIndex = slot >= 6 ? Math.floor(sequence.length / 2) : sequence.length - 1;
      const correct = sequence[missingIndex];
      return {
        sequence,
        missingIndex,
        correct,
        options: shuffle([
          correct,
          ...shuffle(PALETTE.filter((p) => p.name !== correct.name)).slice(0, slot < 4 ? 2 : 3),
        ]),
      };
    });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Complete the pattern" subtitle="What color belongs in the empty spot?" {...shell}>
      <View style={styles.row}>
        {quiz.current.sequence.map((c, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            {i === quiz.current.missingIndex ? (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: RADIUS.md,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: WLIDI.teal,
                  backgroundColor: WLIDI.mint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KText variant="heading">?</KText>
              </View>
            ) : (
              <ColorBlob hex={c.hex} size={52} />
            )}
          </View>
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((c) => (
          <Pressable key={c.name} onPress={() => quiz.pick(c.name === quiz.current.correct.name)}>
            <ColorBlob hex={c.hex} size={60} />
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function OddBloom({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const itemCount = slot < 4 ? 4 : slot < 8 ? 5 : 6;
  const rounds = useMemo(() => {
    return Array.from({ length: 3 }, () => {
      const [main, odd] = shuffle(PALETTE.slice(0, slot < 5 ? 6 : 8));
      const oddIndex = Math.floor(Math.random() * itemCount);
      const items = Array.from({ length: itemCount }, (_, i) => (i === oddIndex ? odd : main));
      return { items, oddIndex };
    });
  }, [itemCount, slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Odd bloom" subtitle="Tap the color that does not belong" {...shell}>
      <View style={styles.row}>
        {quiz.current.items.map((c, i) => (
          <Pressable key={`${c.name}-${i}`} onPress={() => quiz.pick(i === quiz.current.oddIndex)}>
            <ColorBlob hex={c.hex} size={64} />
          </Pressable>
        ))}
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function MixColors({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {

  const rounds = useMemo(() => {
    return shuffle(MIXES)
      .slice(0, 3)
      .map((mix) => {
        const result = color(mix.result);
        return {
          mix,
          a: color(mix.a),
          b: color(mix.b),
          result,
          options: shuffle([result, ...shuffle(PALETTE.filter((p) => p.name !== result.name)).slice(0, 3)]),
        };
      });
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Mix the colors" subtitle="What color do they make together?" {...shell}>
      <View style={[styles.row, { marginBottom: SPACING.md }]}>
        <ColorBlob hex={quiz.current.a.hex} size={70} />
        <KText variant="title" color={WLIDI.coral}>
          +
        </KText>
        <ColorBlob hex={quiz.current.b.hex} size={70} />
        <KText variant="title" color={WLIDI.teal}>
          =
        </KText>
        <KText variant="title">?</KText>
      </View>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((c) => (
          <Pressable key={c.name} onPress={() => quiz.pick(c.name === quiz.current.result.name)}>
            <ColorBlob hex={c.hex} size={62} />
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function NameMatch({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const rounds = useMemo(() => {
    const paletteSize = slot >= 9 ? 8 : 6;
    return shuffle(PALETTE.slice(0, paletteSize))
      .slice(0, 3)
      .map((target) => ({
        target,
        options: shuffle([
          target,
          ...shuffle(PALETTE.filter((p) => p.name !== target.name)).slice(0, slot >= 8 ? 3 : 2),
        ]),
      }));
  }, [slot]);
  const quiz = useRoundQuiz(rounds, onComplete);

  return (
    <GameShell title="Name match" subtitle="Read the color name, then tap the matching bloom" {...shell}>
      <PulseTile onPress={() => {}} color={WLIDI.cream} disabled style={{ alignSelf: 'center' }}>
        <KText variant="title" color={quiz.current.target.hex}>
          {quiz.current.target.name}
        </KText>
      </PulseTile>
      <FeedbackBurst feedback={quiz.feedback} />
      <View style={styles.row}>
        {quiz.current.options.map((c) => (
          <Pressable key={c.name} onPress={() => quiz.pick(c.name === quiz.current.target.name)}>
            <ColorBlob hex={c.hex} size={68} />
          </Pressable>
        ))}
      </View>
      <RoundDots round={quiz.round} total={quiz.total} />
    </GameShell>
  );
}

function ColorMemory({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const sequence = useMemo(() => shuffle(PALETTE).slice(0, 3), [slot]);
  const options = useMemo(
    () => shuffle([...sequence, ...shuffle(PALETTE.filter((p) => !sequence.some((s) => s.name === p.name))).slice(0, 1)]),
    [sequence],
  );
  const [picked, setPicked] = useState<string[]>([]);

  const tap = (name: string) => {
    if (picked.length >= 3) return;
    const next = [...picked, name];
    setPicked(next);
    if (next.length === 3) {
      const hits = next.filter((n, i) => n === sequence[i].name).length;
      onComplete(Math.round((hits / 3) * 100));
    }
  };

  return (
    <GameShell title="Color memory" subtitle="Watch 3 colors, then tap them in the same order" {...shell}>
      <MemoryFlash hexes={sequence.map((c) => c.hex)} duration={1200} />
      <View style={styles.row}>
        {options.map((c) => (
          <Pressable key={c.name} onPress={() => tap(c.name)}>
            <ColorBlob hex={c.hex} size={64} selected={picked[picked.length - 1] === c.name} />
          </Pressable>
        ))}
      </View>
      <KText variant="caption" muted center>
        {picked.length}/3
      </KText>
    </GameShell>
  );
}

function ColorHunt({
  slot,
  onComplete,
  ...shell
}: ShellBits & { slot: number; onComplete: (score: number) => void }) {
  const puzzle = useMemo(() => {
    const target = PALETTE[slot % PALETTE.length];
    const others = PALETTE.filter((p) => p.name !== target.name);
    const blooms = shuffle([
      ...Array.from({ length: 3 + (slot % 2) }, () => target),
      ...shuffle(others).slice(0, 4),
    ]);
    return { target, blooms };
  }, [slot]);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(picked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setPicked(next);
  };

  const check = () => {
    const hits = puzzle.blooms.filter((c, i) => c.name === puzzle.target.name && picked.has(i)).length;
    const needed = puzzle.blooms.filter((c) => c.name === puzzle.target.name).length;
    const wrong = [...picked].filter((i) => puzzle.blooms[i].name !== puzzle.target.name).length;
    const score = Math.max(0, Math.round(((hits - wrong * 0.5) / needed) * 100));
    onComplete(score);
  };

  return (
    <GameShell title="Color hunt" subtitle={`Tap every ${puzzle.target.name.toLowerCase()} bloom`} {...shell}>
      <View style={styles.row}>
        {puzzle.blooms.map((c, i) => (
          <Pressable key={`${c.name}-${i}`} onPress={() => toggle(i)}>
            <ColorBlob hex={c.hex} size={58} selected={picked.has(i)} />
          </Pressable>
        ))}
      </View>
      <KButton label="I found them!" onPress={check} style={{ marginTop: SPACING.xl }} />
    </GameShell>
  );
}

const styles = {
  row: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
};
