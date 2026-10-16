import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';

import { useChildStore } from '../../store/useChildStore';
import { useMyChild } from '../../hooks/api/useProtectionApi';
import { KiddySync } from '../../services/KiddySync';
import { ApiError, api } from '../../lib/api/client';
import { markOnboardingStep } from '../../lib/onboarding';
import { useLockingStore } from '../../store/useLockingStore';

type InstalledAppRow = { packageName: string; appLabel: string | null };

const AppRow = memo(function AppRow({
  item,
  active,
  onToggle,
}: {
  item: InstalledAppRow;
  active: boolean;
  onToggle: (pkg: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(item.packageName)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderRadius: RADIUS.lg,
        backgroundColor: active ? WLIDI.mint : WLIDI.white,
        borderWidth: 2,
        borderColor: active ? WLIDI.teal : WLIDI.outline,
      }}
    >
      <KText variant="body" style={{ flex: 1 }}>
        {item.appLabel ?? item.packageName}
      </KText>
      <KText>{active ? '✓' : ''}</KText>
    </Pressable>
  );
});

export default function SelectApps() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const child = useChildStore((s) => s.child);
  const { data: myChild } = useMyChild();
  const childId = child?.id ?? myChild?.id;
  const protectedApps = useLockingStore((s) => s.syncBundle?.protectedApps);
  const [apps, setApps] = useState<InstalledAppRow[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedSelection = useRef(false);

  const loadApps = useCallback(async () => {
    setLoadingApps(true);
    try {
      const rows = await api.get<InstalledAppRow[]>('/parents/me/child/installed-apps');
      setApps(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load apps from child device');
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  useEffect(() => {
    if (hydratedSelection.current || !protectedApps?.length) return;
    hydratedSelection.current = true;
    setSelected(new Set(protectedApps.filter((a) => a.enabled).map((a) => a.packageName)));
  }, [protectedApps]);

  const toggle = useCallback((pkg: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: InstalledAppRow }) => (
      <AppRow item={item} active={selected.has(item.packageName)} onToggle={toggle} />
    ),
    [selected, toggle],
  );

  const onContinue = async () => {
    if (!childId) {
      Alert.alert('No child', 'Create a child profile first.');
      return;
    }
    if (selected.size === 0) {
      setError('Select at least one app.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = apps
        .filter((a) => selected.has(a.packageName))
        .map((a) => ({
          packageName: a.packageName,
          appLabel: a.appLabel ?? a.packageName,
          enabled: true,
        }));
      await KiddySync.saveProtectedApps(childId, payload);
      if (isEditMode) {
        router.push('/onboarding/reward-rules?mode=edit');
        return;
      }
      await markOnboardingStep('reward-rules');
      router.push('/onboarding/reward-rules');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KScreen scroll={false}>
      <OnboardingShell
        step={isEditMode ? undefined : 5}
        total={isEditMode ? undefined : 8}
        title="Apps to block"
        subtitle="Choose from apps on your child's device. These lock when blocking is ON."
      >
        {loadingApps ? (
          <ActivityIndicator color={WLIDI.teal} style={{ marginTop: SPACING.xl }} />
        ) : apps.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <KText variant="body" muted center>
              No apps yet. Finish permissions and app sync on the child's phone, then tap Refresh.
            </KText>
            <KButton label="Refresh list" variant="sky" onPress={() => void loadApps()} style={{ marginTop: SPACING.lg }} />
          </View>
        ) : (
          <FlashList
            data={apps}
            estimatedItemSize={56}
            keyExtractor={(i) => i.packageName}
            renderItem={renderItem}
            extraData={selected.size}
          />
        )}
        {error ? (
          <KText variant="caption" color="#E53935">
            {error}
          </KText>
        ) : null}
        <KButton
          label={`Continue (${selected.size})`}
          size="lg"
          loading={saving}
          disabled={selected.size === 0 || apps.length === 0}
          onPress={() => void onContinue()}
        />
      </OnboardingShell>
    </KScreen>
  );
}
