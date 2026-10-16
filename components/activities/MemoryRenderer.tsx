import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';
import { emojiFor } from './emoji';

interface Card {
  id: number;
  word: string;
  flipped: boolean;
  matched: boolean;
}

export function MemoryRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};
  const cards = (m.cards ?? []) as string[];

  const deck = useMemo<Card[]>(() => {
    const doubled = [...cards, ...cards].map((word, i) => ({ id: i, word, flipped: false, matched: false }));
    return doubled.sort(() => Math.random() - 0.5);
  }, [cards]);

  const [state, setState] = useState<Card[]>(deck);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const flip = (id: number) => {
    if (busy) return;
    const card = state.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const next = state.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const nowPicked = [...picked, id];
    setState(next);
    setPicked(nowPicked);

    if (nowPicked.length === 2) {
      setMoves((x) => x + 1);
      setBusy(true);
      const [a, b] = nowPicked.map((pid) => next.find((c) => c.id === pid)!);
      const isMatch = a.word === b.word;
      setTimeout(() => {
        setState((cur) =>
          cur.map((c) =>
            c.id === a.id || c.id === b.id
              ? { ...c, matched: isMatch, flipped: isMatch }
              : c,
          ),
        );
        setPicked([]);
        setBusy(false);
      }, 700);
    }
  };

  const allMatched = state.length > 0 && state.every((c) => c.matched);
  const completed = useRef(false);

  useEffect(() => {
    if (allMatched && !busy && !completed.current) {
      completed.current = true;
      // Score: fewer moves = higher. Perfect = pairs count.
      const perfect = cards.length;
      const score = Math.max(40, Math.round((perfect / Math.max(perfect, moves)) * 100));
      const t = setTimeout(() => onComplete(score, { moves }), 500);
      return () => clearTimeout(t);
    }
  }, [allMatched, busy, cards.length, moves, onComplete]);

  return (
    <ActivityShell prompt="Find the matching pairs" step={0} total={1} hint={`Moves: ${moves}`}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.md }}>
        {state.map((c) => {
          const show = c.flipped || c.matched;
          return (
            <Pressable
              key={c.id}
              onPress={() => flip(c.id)}
              style={{
                width: 72,
                height: 88,
                borderRadius: RADIUS.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.matched ? colors.success + '22' : show ? colors.surface : colors.primary,
                borderWidth: 2,
                borderColor: c.matched ? colors.success : colors.outline,
              }}
            >
              <KText style={{ fontSize: 36 }}>{show ? emojiFor(c.word) : '❓'}</KText>
            </Pressable>
          );
        })}
      </View>
    </ActivityShell>
  );
}
