import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';
import { emojiFor, hasEmoji } from './emoji';

interface Pair {
  left: string;
  right: string;
}

/** Handles `match_pairs` and `shadow_match` (object → shadow). */
export function MatchRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};

  const pairs = useMemo<Pair[]>(() => {
    if (activity.type === 'shadow_match') {
      const objects = (m.objects ?? []) as string[];
      return objects.map((o) => ({ left: o, right: o }));
    }
    const raw = (m.pairs ?? []) as [string, string][];
    return raw.map(([a, b]) => ({ left: a, right: b }));
  }, [activity.type, m]);

  const rights = useMemo(() => pairs.map((p) => p.right).sort(() => Math.random() - 0.5), [pairs]);

  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);

  const matchedRights = new Set(Object.values(matches));

  const pick = (right: string) => {
    if (!activeLeft) return;
    const pair = pairs.find((p) => p.left === activeLeft);
    if (pair && pair.right === right) {
      setMatches((prev) => ({ ...prev, [activeLeft]: right }));
      setActiveLeft(null);
      setWrong(null);
    } else {
      setWrong(right);
      setTimeout(() => setWrong(null), 500);
    }
  };

  const done = Object.keys(matches).length === pairs.length;

  const renderLabel = (w: string, shadow = false) => {
    if (hasEmoji(w)) return <KText style={{ fontSize: 34, opacity: shadow ? 0.25 : 1 }}>{emojiFor(w)}</KText>;
    return <KText variant="heading">{w}</KText>;
  };

  return (
    <ActivityShell
      prompt={activity.type === 'shadow_match' ? 'Match each to its shadow' : 'Match the pairs'}
      step={0}
      total={1}
      hint="Tap one on the left, then its match on the right"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          {pairs.map((p) => {
            const matched = p.left in matches;
            const active = activeLeft === p.left;
            return (
              <Pressable
                key={p.left}
                disabled={matched}
                onPress={() => setActiveLeft(p.left)}
                style={{
                  padding: SPACING.md,
                  borderRadius: RADIUS.lg,
                  marginBottom: SPACING.sm,
                  alignItems: 'center',
                  backgroundColor: matched ? colors.success + '22' : active ? colors.primaryContainer : colors.surface,
                  borderWidth: 2,
                  borderColor: matched ? colors.success : active ? colors.primary : colors.outline,
                  opacity: matched ? 0.6 : 1,
                }}
              >
                {renderLabel(p.left)}
              </Pressable>
            );
          })}
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          {rights.map((r) => {
            const used = matchedRights.has(r);
            const isWrong = wrong === r;
            return (
              <Pressable
                key={r}
                disabled={used}
                onPress={() => pick(r)}
                style={{
                  padding: SPACING.md,
                  borderRadius: RADIUS.lg,
                  marginBottom: SPACING.sm,
                  alignItems: 'center',
                  backgroundColor: used ? colors.success + '22' : isWrong ? colors.error + '22' : colors.surface,
                  borderWidth: 2,
                  borderColor: used ? colors.success : isWrong ? colors.error : colors.outline,
                  opacity: used ? 0.6 : 1,
                }}
              >
                {renderLabel(r, activity.type === 'shadow_match')}
              </Pressable>
            );
          })}
        </View>
      </View>

      <KButton
        label={done ? 'Great! Continue 🎉' : 'Match them all'}
        variant={done ? 'success' : 'primary'}
        disabled={!done}
        onPress={() => onComplete(100, { matches })}
        style={{ marginTop: SPACING.lg }}
      />
    </ActivityShell>
  );
}
