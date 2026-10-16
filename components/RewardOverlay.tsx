import React, { useEffect } from 'react';
import { Modal, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { RADIUS, SPACING } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { useRewardStore } from '../store/useRewardStore';
import { Confetti } from './ui/Confetti';
import { KButton } from './ui/KButton';
import { KText } from './ui/KText';

export function RewardOverlay() {
  const colors = useThemeColors();
  const { visible, reward, dismiss } = useRewardStore();

  const scale = useSharedValue(0.6);
  const badge = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
      badge.value = withDelay(250, withSequence(withTiming(1.2, { duration: 250 }), withSpring(1)));
    } else {
      scale.value = 0.6;
      badge.value = 0;
    }
  }, [visible, scale, badge]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));

  if (!reward) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.lg,
        }}
      >
        <Confetti active={visible} />

        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 380,
              backgroundColor: colors.surface,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
              alignItems: 'center',
            },
            cardStyle,
          ]}
        >
          <Animated.View style={badgeStyle}>
            <KText style={{ fontSize: 72 }}>{reward.leveledUp ? '🏆' : '🎉'}</KText>
          </Animated.View>

          <KText variant="title" center style={{ marginTop: SPACING.sm }}>
            {reward.leveledUp ? `Level ${reward.newLevel}!` : 'Great Job!'}
          </KText>
          <KText variant="body" muted center style={{ marginTop: SPACING.xs }}>
            {reward.leveledUp ? 'You leveled up!' : 'You completed the activity!'}
          </KText>

          <View style={{ flexDirection: 'row', marginTop: SPACING.lg, gap: SPACING.md }}>
            <RewardStat emoji="⭐" value={`+${reward.starsEarned}`} label="Stars" color={colors.warning} />
            <RewardStat emoji="✨" value={`+${reward.xpEarned}`} label="XP" color={colors.secondary} />
            {reward.streak ? (
              <RewardStat emoji="🔥" value={`${reward.streak}`} label="Streak" color="#FF8A3D" />
            ) : null}
          </View>

          {reward.unlockedAchievements && reward.unlockedAchievements.length > 0 ? (
            <View
              style={{
                marginTop: SPACING.lg,
                padding: SPACING.md,
                borderRadius: RADIUS.lg,
                backgroundColor: colors.primaryContainer,
                width: '100%',
              }}
            >
              <KText variant="label" center color={colors.primary}>
                🏅 Achievement Unlocked!
              </KText>
              {reward.unlockedAchievements.map((a) => (
                <KText key={a.code} center muted style={{ marginTop: 4 }}>
                  {a.title}
                </KText>
              ))}
            </View>
          ) : null}

          <KButton label="Awesome!" onPress={dismiss} style={{ marginTop: SPACING.xl }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function RewardStat({
  emoji,
  value,
  label,
  color,
}: {
  emoji: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <KText style={{ fontSize: 32 }}>{emoji}</KText>
      <KText variant="heading" color={color}>
        {value}
      </KText>
      <KText variant="caption" muted>
        {label}
      </KText>
    </View>
  );
}
