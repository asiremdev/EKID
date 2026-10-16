import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KText } from '../ui/KText';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';

interface Props {
  step?: number;
  total?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function OnboardingShell({ step, total, title, subtitle, children }: Props) {
  const showProgress = step != null && total != null && total > 0;
  const progress = showProgress ? step! / total! : 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {showProgress ? (
          <>
            <KText variant="caption" muted>
              Step {step} of {total}
            </KText>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
          </>
        ) : null}
        <KText variant="title" color={WLIDI.teal} style={{ marginTop: SPACING.lg }}>
          {title}
        </KText>
        {subtitle ? (
          <KText variant="body" muted style={{ marginTop: SPACING.xs }}>
            {subtitle}
          </KText>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  track: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: WLIDI.mint,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: WLIDI.coral,
    borderRadius: RADIUS.full,
  },
  body: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
});
