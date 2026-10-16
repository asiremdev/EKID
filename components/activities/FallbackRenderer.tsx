import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';

const TYPE_EMOJI: Record<string, string> = {
  puzzle: '🧩',
  maze: '🌀',
  word_search: '🔤',
  crossword: '🔠',
};

/**
 * Interactive-lite renderer for construction-style activities. The child taps
 * through the sub-tasks (pieces, words, path steps) to complete the activity.
 */
export function FallbackRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};

  const tasks = useMemo<string[]>(() => {
    switch (activity.type) {
      case 'word_search':
        return (m.words ?? []) as string[];
      case 'puzzle': {
        const n = Number(m.rows ?? 2) * Number(m.cols ?? 2);
        return Array.from({ length: n }).map((_, i) => `Piece ${i + 1}`);
      }
      case 'crossword': {
        const across = Object.values((m.across ?? {}) as Record<string, string>);
        const down = Object.values((m.down ?? {}) as Record<string, string>);
        return [...across.map((w) => `→ ${w}`), ...down.map((w) => `↓ ${w}`)];
      }
      case 'maze':
        return ['Start', 'Turn', 'Go', 'Exit'];
      default:
        return ['Complete'];
    }
  }, [activity.type, m]);

  const [done, setDone] = useState<Set<number>>(new Set());
  const allDone = done.size >= tasks.length;

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });

  const verb =
    activity.type === 'word_search'
      ? 'Find each word'
      : activity.type === 'puzzle'
        ? 'Place each piece'
        : activity.type === 'crossword'
          ? 'Solve each clue'
          : 'Follow the path';

  return (
    <ActivityShell prompt={`${TYPE_EMOJI[activity.type] ?? '⭐'} ${activity.title}`} step={0} total={1} hint={verb}>
      <View style={{ gap: SPACING.sm }}>
        {tasks.map((t, i) => {
          const tapped = done.has(i);
          return (
            <Pressable
              key={i}
              onPress={() => toggle(i)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: RADIUS.lg,
                backgroundColor: tapped ? colors.success + '22' : colors.surface,
                borderWidth: 2,
                borderColor: tapped ? colors.success : colors.outline,
              }}
            >
              <KText style={{ fontSize: 22, marginRight: SPACING.md }}>{tapped ? '✅' : '⬜'}</KText>
              <KText variant="heading">{t}</KText>
            </Pressable>
          );
        })}
      </View>

      <KButton
        label={allDone ? 'Finished! 🎉' : 'Tap each to complete'}
        variant={allDone ? 'success' : 'primary'}
        disabled={!allDone}
        onPress={() => onComplete(100, { completed: tasks.length })}
        style={{ marginTop: SPACING.xl }}
      />
    </ActivityShell>
  );
}
