import React from 'react';
import { View } from 'react-native';
import { SPACING } from '../../constants/theme';
import { ProgressBar } from '../ui/ProgressBar';
import { KText } from '../ui/KText';

interface ActivityShellProps {
  prompt: string;
  step: number;
  total: number;
  hint?: string;
  children: React.ReactNode;
}

/** Shared layout for question-based renderers: prompt + progress + body. */
export function ActivityShell({ prompt, step, total, hint, children }: ActivityShellProps) {
  return (
    <View style={{ flex: 1 }}>
      <ProgressBar progress={total > 0 ? step / total : 0} height={10} />
      <KText variant="caption" muted style={{ marginTop: SPACING.sm }}>
        Question {Math.min(step + 1, total)} of {total}
      </KText>
      <KText variant="title" style={{ marginTop: SPACING.md, marginBottom: SPACING.lg }}>
        {prompt}
      </KText>
      {hint ? (
        <KText variant="caption" muted style={{ marginBottom: SPACING.md }}>
          {hint}
        </KText>
      ) : null}
      {children}
    </View>
  );
}
