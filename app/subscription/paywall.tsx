import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { KCard } from '../../components/ui/KCard';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { formatDa, whatsappCheckoutUrl, WLIDI_PLANS } from '../../constants/billing';
import { useAuthStore } from '../../store/useAuthStore';
import { useSubscription } from '../../hooks/api/useSubscriptionApi';

const PERKS = ['50-level worlds on every game', 'Remote app blocking', 'Stars for screen time', 'Up to 5 kids on yearly / lifetime'];

export default function Paywall() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: sub } = useSubscription();
  const [selected, setSelected] = useState<(typeof WLIDI_PLANS)[number]['plan']>('YEAR_1');
  const plan = WLIDI_PLANS.find((p) => p.plan === selected) ?? WLIDI_PLANS[1];

  const daysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0;

  const checkoutUrl = whatsappCheckoutUrl({
    name: user?.name ?? 'Parent',
    accountId: user?.id ?? 'pending',
    planLabel: plan.label,
    amountDa: plan.amountDa,
  });

  return (
    <KScreen>
      <View style={{ alignItems: 'center', marginTop: SPACING.lg }}>
        <KText style={{ fontSize: 56 }}>🌿</KText>
        <KText variant="title" center>
          Unlock WLIDI
        </KText>
        {sub?.status === 'TRIAL' ? (
          <KText variant="body" muted center style={{ marginTop: SPACING.xs }}>
            {daysLeft} day{daysLeft === 1 ? '' : 's'} left in your free trial
          </KText>
        ) : null}
      </View>

      <KCard color={WLIDI.mint} style={{ marginTop: SPACING.lg, borderColor: WLIDI.mintDark }}>
        {PERKS.map((perk) => (
          <View key={perk} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }}>
            <KText style={{ marginRight: SPACING.sm }}>✅</KText>
            <KText>{perk}</KText>
          </View>
        ))}
      </KCard>

      <View style={{ marginTop: SPACING.lg }}>
        {WLIDI_PLANS.map((p) => {
          const active = p.plan === selected;
          return (
            <KCard
              key={p.plan}
              onPress={() => setSelected(p.plan)}
              color={active ? WLIDI.peachLight : WLIDI.white}
              style={{
                marginBottom: SPACING.md,
                borderWidth: 2,
                borderColor: active ? WLIDI.coral : WLIDI.outline,
                borderRadius: RADIUS.xxl,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <KText variant="heading">{p.label}</KText>
                    {p.badge ? (
                      <View
                        style={{
                          marginLeft: SPACING.sm,
                          backgroundColor: WLIDI.starGold,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                        }}
                      >
                        <KText variant="caption" color={WLIDI.text} style={{ fontWeight: '700' }}>
                          {p.badge}
                        </KText>
                      </View>
                    ) : null}
                  </View>
                  <KText variant="caption" muted>
                    {p.blurb}
                  </KText>
                </View>
                <KText variant="title" color={WLIDI.teal}>
                  {formatDa(p.amountDa)}
                </KText>
              </View>
            </KCard>
          );
        })}
      </View>

      <WhatsAppButton url={checkoutUrl} label={`Pay ${formatDa(plan.amountDa)} on WhatsApp`} />
      <KButton label="Maybe later" variant="ghost" onPress={() => router.back()} style={{ marginTop: SPACING.sm }} />
    </KScreen>
  );
}
