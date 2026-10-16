import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SPACING } from '../../constants/theme';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { OptionButton } from './OptionButton';
import { RendererProps } from './types';

export function MissingNumberRenderer({ activity, onComplete }: RendererProps) {
  const m = activity.metadata ?? {};
  const sequence = (m.sequence ?? []) as (number | null)[];
  const answer = Number(m.answer ?? 0);

  const options = useMemo(() => {
    const set = new Set<number>([answer, answer + 1, Math.max(0, answer - 1), answer + 2]);
    return Array.from(set).slice(0, 3).sort(() => Math.random() - 0.5);
  }, [answer]);

  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isCorrect = selected === answer;

  return (
    <ActivityShell prompt="What number is missing?" step={0} total={1}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.xl }}>
        {sequence.map((s, i) => (
          <KText key={i} style={{ fontSize: 48, marginHorizontal: SPACING.sm }}>
            {s === null ? '❓' : s}
          </KText>
        ))}
      </View>

      {options.map((opt) => {
        let state: 'idle' | 'correct' | 'wrong' | 'selected' = 'idle';
        if (revealed) {
          if (opt === answer) state = 'correct';
          else if (opt === selected) state = 'wrong';
        } else if (opt === selected) state = 'selected';
        return (
          <OptionButton
            key={opt}
            label={String(opt)}
            big
            state={state}
            disabled={revealed}
            onPress={() => setSelected(opt)}
          />
        );
      })}

      {!revealed ? (
        <KButton label="Check" disabled={selected === null} onPress={() => setRevealed(true)} />
      ) : (
        <KButton
          label="Continue"
          variant={isCorrect ? 'success' : 'primary'}
          onPress={() => onComplete(isCorrect ? 100 : 0, { selected })}
        />
      )}
    </ActivityShell>
  );
}
