import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KInput } from '../../components/ui/KInput';
import { KButton } from '../../components/ui/KButton';
import { KCard } from '../../components/ui/KCard';
import { Avatar } from '../../components/ui/Avatar';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING, WLIDI } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { AGE_GROUPS, AVATARS, ageGroupMeta } from '../../constants/design';
import { useChildren, useCreateChild } from '../../hooks/api/useChildrenApi';
import { useSubscription } from '../../hooks/api/useSubscriptionApi';
import { useChildStore } from '../../store/useChildStore';
import type { AgeGroup, Child } from '../../lib/api/types';
import { ApiError } from '../../lib/api/client';
import { markOnboardingStep } from '../../lib/onboarding';

export default function CreateChild() {
  const colors = useThemeColors();
  const router = useRouter();
  const createChild = useCreateChild();
  const setChild = useChildStore((s) => s.setChild);
  const selected = useChildStore((s) => s.child);
  const { data: children, isLoading } = useChildren();
  const { data: sub } = useSubscription();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kidsUsed = children?.length ?? 0;
  const maxKids = sub?.maxKids ?? 2;
  const canAdd = kidsUsed < maxKids;

  useEffect(() => {
    if (!children?.length) {
      setAdding(true);
      return;
    }
    if (!selected || !children.some((c) => c.id === selected.id)) {
      setChild(children[0]);
    }
  }, [children, selected, setChild]);

  const continueSetup = async (child?: Child) => {
    if (child) setChild(child);
    await markOnboardingStep('pair-device');
    router.push('/onboarding/pair-device');
  };

  const onSubmit = async () => {
    if (!name.trim() || !ageGroup) {
      setError('Please add a name and pick an age group');
      return;
    }
    setError(null);
    try {
      const child = await createChild.mutateAsync({ name: name.trim(), avatar, ageGroup });
      setChild(child);
      setAdding(false);
      setName('');
      await markOnboardingStep('pair-device');
      router.push('/onboarding/pair-device');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create profile');
    }
  };

  if (isLoading) {
    return (
      <KScreen>
        <KText muted style={{ marginTop: SPACING.xl, textAlign: 'center' }}>
          Loading…
        </KText>
      </KScreen>
    );
  }

  const form = (
    <>
      <KInput label="Child's name" icon="🙂" value={name} onChangeText={setName} placeholder="e.g. Mia" />

      <KText variant="label" muted style={{ marginTop: SPACING.sm, marginBottom: SPACING.sm }}>
        Pick an avatar
      </KText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {AVATARS.map((a) => {
          const active = a.id === avatar;
          return (
            <Pressable
              key={a.id}
              onPress={() => setAvatar(a.id)}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: a.color + (active ? '44' : '18'),
                borderWidth: active ? 3 : 1,
                borderColor: active ? a.color : colors.outline,
              }}
            >
              <KText style={{ fontSize: 30 }}>{a.emoji}</KText>
            </Pressable>
          );
        })}
      </View>

      <KText variant="label" muted style={{ marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
        Age group
      </KText>
      {AGE_GROUPS.map((g) => {
        const active = g.id === ageGroup;
        return (
          <KCard
            key={g.id}
            onPress={() => setAgeGroup(g.id)}
            color={active ? g.color + '22' : undefined}
            style={{
              marginBottom: SPACING.sm,
              borderColor: active ? g.color : colors.outline,
              borderWidth: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <KText style={{ fontSize: 34, marginRight: SPACING.md }}>{g.emoji}</KText>
              <View style={{ flex: 1 }}>
                <KText variant="heading">
                  {g.label} · {g.range}
                </KText>
                <KText variant="caption" muted>
                  {g.blurb}
                </KText>
              </View>
            </View>
          </KCard>
        );
      })}

      {error ? (
        <KText variant="caption" color={colors.error} style={{ marginTop: SPACING.sm }}>
          {error}
        </KText>
      ) : null}

      <KButton
        label="Continue"
        size="lg"
        loading={createChild.isPending}
        disabled={!name.trim() || !ageGroup}
        onPress={() => void onSubmit()}
        style={{ marginTop: SPACING.lg }}
      />
      {kidsUsed > 0 ? (
        <KButton label="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ marginTop: SPACING.sm }} />
      ) : null}
    </>
  );

  if (kidsUsed > 0 && !adding) {
    return (
      <KScreen>
        <OnboardingShell
          step={2}
          total={8}
          title="Your children"
          subtitle={`This plan allows ${maxKids} kid${maxKids === 1 ? '' : 's'}. ${kidsUsed} in use.`}
        >
          {(children ?? []).map((child) => {
            const meta = ageGroupMeta(child.ageGroup);
            const active = selected?.id === child.id;
            return (
              <KCard
                key={child.id}
                onPress={() => setChild(child)}
                color={active ? WLIDI.mint : undefined}
                style={{
                  marginBottom: SPACING.sm,
                  borderWidth: 2,
                  borderColor: active ? WLIDI.teal : colors.outline,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar avatarId={child.avatar} size={56} />
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <KText variant="heading">{child.name}</KText>
                    <KText variant="caption" muted>
                      {meta.label} · {meta.game}
                    </KText>
                    <KText variant="caption" color={WLIDI.starGold} style={{ marginTop: 4 }}>
                      ⭐ {child.stars} stars
                    </KText>
                  </View>
                </View>
              </KCard>
            );
          })}

          {canAdd ? (
            <KButton label="Add another child" variant="mint" onPress={() => setAdding(true)} style={{ marginTop: SPACING.md }} />
          ) : (
            <KButton
              label="Kid limit reached — upgrade"
              variant="sky"
              onPress={() => router.push('/subscription/paywall')}
              style={{ marginTop: SPACING.md }}
            />
          )}
          <KButton
            label="Continue to pairing"
            size="lg"
            onPress={() => void continueSetup(selected ?? children?.[0])}
            style={{ marginTop: SPACING.sm }}
          />
        </OnboardingShell>
      </KScreen>
    );
  }

  return (
    <KScreen>
      <OnboardingShell
        step={2}
        total={8}
        title={kidsUsed > 0 ? 'Add another child' : 'Create Your Child'}
        subtitle="Age picks the educative game on their tablet."
      >
        {form}
      </OnboardingShell>
    </KScreen>
  );
}
