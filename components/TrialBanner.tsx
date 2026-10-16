import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { RADIUS, SPACING } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { useSubscription } from '../hooks/api/useSubscriptionApi';
import { KText } from './ui/KText';
import { KButton } from './ui/KButton';

export function TrialBanner() {
  const colors = useThemeColors();
  const router = useRouter();
  const { data: sub } = useSubscription();
  if (!sub) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86_400_000));

  let bg = colors.primaryContainer;
  let title = '';
  let subtitle = '';
  let cta = 'See plans';

  if (sub.status === 'TRIAL') {
    bg = daysLeft <= 1 ? colors.error + '22' : colors.primaryContainer;
    title = `⏳ ${daysLeft} day${daysLeft === 1 ? '' : 's'} left in trial`;
    subtitle = 'Subscribe to keep learning after the trial';
  } else if (sub.status === 'ACTIVE') {
    return null;
  } else {
    bg = colors.error + '22';
    title = '🔒 Your subscription has expired';
    subtitle = 'Renew to unlock activities again';
    cta = 'Renew';
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: bg,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <KText variant="label">{title}</KText>
        <KText variant="caption" muted>
          {subtitle}
        </KText>
      </View>
      <KButton label={cta} size="sm" full={false} onPress={() => router.push('/subscription/paywall')} />
    </View>
  );
}
