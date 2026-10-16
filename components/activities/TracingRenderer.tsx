import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { RendererProps } from './types';

/**
 * Lightweight tracing: the child taps the big glyph repeatedly to "trace" it;
 * each tap fills more of the outline. Avoids native SVG/skia dependencies.
 */
export function TracingRenderer({ activity, onComplete }: RendererProps) {
  const colors = useThemeColors();
  const m = activity.metadata ?? {};
  const glyph = String(m.letter ?? m.number ?? '?');
  const totalTaps = 4;

  const [taps, setTaps] = useState(0);
  const fill = useSharedValue(0);

  const onTap = () => {
    const next = Math.min(totalTaps, taps + 1);
    setTaps(next);
    fill.value = withTiming(next / totalTaps, { duration: 250 });
  };

  const fillStyle = useAnimatedStyle(() => ({ opacity: 0.25 + fill.value * 0.75 }));
  const done = taps >= totalTaps;

  return (
    <ActivityShell prompt={`Trace the ${m.letter ? 'letter' : 'number'} ${glyph}`} step={0} total={1} hint="Tap to trace!">
      <View style={{ alignItems: 'center', marginVertical: SPACING.xl }}>
        <View
          onTouchEnd={onTap}
          style={{
            width: 200,
            height: 200,
            borderRadius: RADIUS.xl,
            backgroundColor: colors.surface,
            borderWidth: 3,
            borderColor: colors.outline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View style={fillStyle}>
            <KText style={{ fontSize: 140, color: colors.primary }}>{glyph}</KText>
          </Animated.View>
        </View>
        <KText variant="caption" muted style={{ marginTop: SPACING.md }}>
          {taps}/{totalTaps} traced
        </KText>
      </View>

      <KButton
        label={done ? 'Great tracing! 🎉' : 'Keep tracing'}
        variant={done ? 'success' : 'primary'}
        disabled={!done}
        onPress={() => onComplete(100)}
      />
    </ActivityShell>
  );
}
