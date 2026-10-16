import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { KText } from '../ui/KText';
import { RADIUS, SHADOW, SPACING, WLIDI } from '../../constants/theme';

export function useRoundQuiz<T>(rounds: T[], onComplete: (score: number) => void, delay = 480) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);
  const locked = useRef(false);

  const pick = (isCorrect: boolean) => {
    if (locked.current || rounds.length === 0) return;
    locked.current = true;
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    setFeedback(isCorrect ? 'ok' : 'no');
    setTimeout(() => {
      if (round + 1 >= rounds.length) {
        onComplete(Math.round((nextCorrect / rounds.length) * 100));
      } else {
        setCorrect(nextCorrect);
        setRound(round + 1);
        setFeedback(null);
        locked.current = false;
      }
    }, delay);
  };

  return {
    round,
    total: rounds.length,
    current: rounds[round],
    feedback,
    pick,
  };
}

export function FeedbackBurst({ feedback }: { feedback: 'ok' | 'no' | null }) {
  if (!feedback) return null;
  return (
    <KText variant="title" center color={feedback === 'ok' ? WLIDI.teal : '#E53935'} style={{ marginBottom: SPACING.sm }}>
      {feedback === 'ok' ? 'Yes! ⭐' : 'Try the next one'}
    </KText>
  );
}

export function RoundDots({ round, total }: { round: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < round ? WLIDI.teal : i === round ? WLIDI.coral : WLIDI.outline },
          ]}
        />
      ))}
    </View>
  );
}

interface ChoiceProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  used?: boolean;
  color?: string;
  size?: 'md' | 'lg';
  style?: ViewStyle;
}

export function Choice({ label, onPress, disabled, selected, used, color, size = 'md', style }: ChoiceProps) {
  const dim = size === 'lg' ? 78 : 64;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || used}
      style={({ pressed }) => [
        styles.choice,
        SHADOW.sm,
        {
          minWidth: dim,
          height: dim,
          backgroundColor: selected ? WLIDI.mint : used ? WLIDI.peachLight : color ?? WLIDI.white,
          borderColor: selected ? WLIDI.teal : used ? WLIDI.coral : WLIDI.outline,
          opacity: used ? 0.45 : pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      <KText variant="heading" center>
        {label}
      </KText>
    </Pressable>
  );
}

export function ColorBlob({ hex, size = 72, dashed, selected }: { hex: string; size?: number; dashed?: boolean; selected?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dashed ? WLIDI.mint : hex,
        borderWidth: selected ? 4 : 3,
        borderColor: selected ? WLIDI.teal : WLIDI.white,
        borderStyle: dashed ? 'dashed' : 'solid',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOW.sm,
      }}
    />
  );
}

export function PulseTile({
  children,
  onPress,
  color,
  selected,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  color?: string;
  selected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.pulse,
          SHADOW.sm,
          {
            backgroundColor: selected ? WLIDI.mint : color ?? WLIDI.white,
            borderColor: selected ? WLIDI.teal : WLIDI.outline,
            opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          },
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function MemoryFlash({ hexes, duration = 1200 }: { hexes: string[]; duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [hexes, duration]);

  if (!visible) {
    return (
      <View style={styles.flashHidden}>
        {hexes.map((_, i) => (
          <View key={i} style={styles.hiddenSlot}>
            <KText variant="heading">?</KText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.flashRow}>
      {hexes.map((hex, i) => (
        <ColorBlob key={`${hex}-${i}`} hex={hex} size={64} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
  },
  choice: {
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    minWidth: 72,
    minHeight: 64,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    minHeight: 80,
    alignItems: 'center',
  },
  flashHidden: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    minHeight: 80,
    alignItems: 'center',
  },
  hiddenSlot: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: WLIDI.teal,
    backgroundColor: WLIDI.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
