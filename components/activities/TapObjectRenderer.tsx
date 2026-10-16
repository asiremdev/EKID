import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';
import { emojiFor } from './emoji';

interface Item {
  id: number;
  word: string;
  isTarget: boolean;
}

export function TapObjectRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};
  const target = String(m.target ?? 'star');
  const count = Number(m.count ?? 3);
  const distractors = (m.distractors ?? []) as string[];

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    let id = 0;
    for (let i = 0; i < count; i++) list.push({ id: id++, word: target, isTarget: true });
    for (const d of distractors) {
      for (let i = 0; i < 2; i++) list.push({ id: id++, word: d, isTarget: false });
    }
    return list.sort(() => Math.random() - 0.5);
  }, [target, count, distractors]);

  const [tapped, setTapped] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setTapped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finish = () => {
    const correctTaps = items.filter((it) => it.isTarget && tapped.has(it.id)).length;
    const wrongTaps = items.filter((it) => !it.isTarget && tapped.has(it.id)).length;
    const score = Math.max(0, Math.round(((correctTaps - wrongTaps) / count) * 100));
    onComplete(Math.min(100, score), { tapped: Array.from(tapped) });
  };

  return (
    <ActivityShell prompt={`Tap all the ${target}s ${emojiFor(target)}`} step={0} total={1} hint="Tap each one you find">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.md }}>
        {items.map((it) => {
          const on = tapped.has(it.id);
          return (
            <Pressable
              key={it.id}
              onPress={() => toggle(it.id)}
              style={{
                width: 76,
                height: 76,
                borderRadius: RADIUS.lg,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.primaryContainer : colors.surface,
                borderWidth: 2,
                borderColor: on ? colors.primary : colors.outline,
              }}
            >
              <KText style={{ fontSize: 38 }}>{emojiFor(it.word)}</KText>
            </Pressable>
          );
        })}
      </View>
      <KButton label="Done" onPress={finish} style={{ marginTop: SPACING.xl }} disabled={tapped.size === 0} />
    </ActivityShell>
  );
}
