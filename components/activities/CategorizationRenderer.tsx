import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';
import { emojiFor } from './emoji';

export function CategorizationRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};
  const groups = (m.groups ?? []) as string[];
  const itemMap = (m.items ?? {}) as Record<string, string>;
  const items = useMemo(() => Object.keys(itemMap).sort(() => Math.random() - 0.5), [itemMap]);

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [activeItem, setActiveItem] = useState<string | null>(items[0] ?? null);

  const assign = (group: string) => {
    if (!activeItem) return;
    const next = { ...assignments, [activeItem]: group };
    setAssignments(next);
    const remaining = items.find((it) => !(it in next));
    setActiveItem(remaining ?? null);
  };

  const done = items.every((it) => it in assignments);

  const finish = () => {
    const correct = items.filter((it) => assignments[it] === itemMap[it]).length;
    onComplete(Math.round((correct / items.length) * 100), { assignments });
  };

  return (
    <ActivityShell prompt="Sort each item into its group" step={0} total={1}>
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        {activeItem ? (
          <>
            <KText style={{ fontSize: 64 }}>{emojiFor(activeItem)}</KText>
            <KText variant="heading">{activeItem}</KText>
            <KText variant="caption" muted>
              Which group?
            </KText>
          </>
        ) : (
          <KText variant="heading" color={colors.success}>
            All sorted! 🎉
          </KText>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        {groups.map((g) => {
          const inGroup = items.filter((it) => assignments[it] === g);
          return (
            <Pressable
              key={g}
              onPress={() => assign(g)}
              disabled={!activeItem}
              style={{
                flex: 1,
                minHeight: 120,
                borderRadius: RADIUS.lg,
                borderWidth: 2,
                borderColor: colors.outline,
                backgroundColor: colors.surface,
                padding: SPACING.md,
                alignItems: 'center',
              }}
            >
              <KText variant="label" style={{ marginBottom: SPACING.sm }}>
                {g}
              </KText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {inGroup.map((it) => (
                  <KText key={it} style={{ fontSize: 26, margin: 2 }}>
                    {emojiFor(it)}
                  </KText>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <KButton
        label="Done"
        variant={done ? 'success' : 'primary'}
        disabled={!done}
        onPress={finish}
        style={{ marginTop: SPACING.xl }}
      />
    </ActivityShell>
  );
}
