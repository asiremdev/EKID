import React, { useState } from 'react';
import { View } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { KInput } from '../ui/KInput';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';

export function ReadingRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};
  const text = String(m.text ?? '');
  const question = String(m.question ?? '');
  const answer = String(m.answer ?? '').toLowerCase().trim();

  const [phase, setPhase] = useState<'read' | 'answer'>('read');
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const isCorrect = value.toLowerCase().trim().includes(answer) && answer.length > 0;

  if (phase === 'read') {
    return (
      <ActivityShell prompt="Read the sentence" step={0} total={1} hint="Read it out loud!">
        <View
          style={{
            backgroundColor: colors.primaryContainer,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            marginBottom: SPACING.xl,
          }}
        >
          <KText variant="title" center>
            {text}
          </KText>
        </View>
        <KButton label="I read it! 📖" onPress={() => setPhase('answer')} />
      </ActivityShell>
    );
  }

  return (
    <ActivityShell prompt={question} step={0} total={1}>
      <KInput placeholder="Type your answer" value={value} onChangeText={setValue} autoCapitalize="none" />
      {revealed ? (
        <KText variant="caption" color={isCorrect ? colors.success : colors.error} style={{ marginBottom: SPACING.md }}>
          {isCorrect ? 'Correct! 🎉' : `The answer was: ${m.answer}`}
        </KText>
      ) : null}
      {!revealed ? (
        <KButton label="Check" disabled={!value} onPress={() => setRevealed(true)} />
      ) : (
        <KButton
          label="Continue"
          variant={isCorrect ? 'success' : 'primary'}
          onPress={() => onComplete(isCorrect ? 100 : 50, { value })}
        />
      )}
    </ActivityShell>
  );
}
