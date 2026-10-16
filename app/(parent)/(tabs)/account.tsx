import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../../components/ui/KScreen';
import { KText } from '../../../components/ui/KText';
import { KButton } from '../../../components/ui/KButton';
import { KCard } from '../../../components/ui/KCard';
import { WhatsAppButton } from '../../../components/ui/WhatsAppButton';
import { WlidiLogo } from '../../../components/ui/WlidiLogo';
import { SPACING, WLIDI } from '../../../constants/theme';
import { formatDa, whatsappCheckoutUrl, WLIDI_PLANS } from '../../../constants/billing';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSubscription } from '../../../hooks/api/useSubscriptionApi';

export default function AccountTab() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: sub } = useSubscription();

  const currentPlan = WLIDI_PLANS.find((p) => p.plan === sub?.plan);
  const checkoutPlan = currentPlan ?? WLIDI_PLANS[1];
  const checkoutUrl = whatsappCheckoutUrl({
    name: user?.name ?? 'Parent',
    accountId: user?.id ?? 'pending',
    planLabel: checkoutPlan.label,
    amountDa: checkoutPlan.amountDa,
  });

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  };

  return (
    <KScreen>
      <View style={styles.logoWrap}>
        <WlidiLogo size="md" />
      </View>

      <KCard color={WLIDI.white} style={{ marginBottom: SPACING.md }}>
        <KText variant="caption" muted>
          Signed in as
        </KText>
        <KText variant="title">{user?.name ?? 'Parent'}</KText>
        <KText variant="body" muted>
          {user?.email ?? ''}
        </KText>
      </KCard>

      <KCard color={WLIDI.mint} style={{ marginBottom: SPACING.md, borderColor: WLIDI.mintDark }}>
        <KText variant="caption" muted>
          Plan
        </KText>
        <KText variant="heading">
          {sub?.status === 'ACTIVE' && currentPlan ? currentPlan.label : sub?.status === 'TRIAL' ? 'Free trial' : 'No active plan'}
        </KText>
        <KText variant="caption" muted style={{ marginTop: 4 }}>
          {sub?.kidsUsed ?? 0}/{sub?.maxKids ?? 2} kids · {currentPlan ? formatDa(currentPlan.amountDa) : 'Upgrade anytime'}
        </KText>
      </KCard>

      <WhatsAppButton url={checkoutUrl} label="Pay on WhatsApp" style={{ marginBottom: SPACING.sm }} />
      <KButton label="See plans" variant="sky" onPress={() => router.push('/subscription/paywall')} />
      <KButton
        label="Re-pair child device"
        variant="mint"
        onPress={() => router.push('/onboarding/pair-device')}
        style={{ marginTop: SPACING.sm }}
      />
      <KButton
        label="Add / switch child"
        variant="white"
        onPress={() => router.push('/onboarding/create-child')}
        style={{ marginTop: SPACING.sm }}
      />
      <KButton
        label="Run setup again"
        variant="ghost"
        onPress={() => router.push('/onboarding/welcome')}
        style={{ marginTop: SPACING.sm }}
      />
      <KButton label="Log out" variant="ghost" onPress={confirmLogout} style={{ marginTop: SPACING.lg }} />

      <KText variant="caption" muted center style={{ marginTop: SPACING.xxl }}>
        WLIDI v2.0 · Parent mode
      </KText>
    </KScreen>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
});
