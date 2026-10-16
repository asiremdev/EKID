import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { View, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { useChildStore } from '../../store/useChildStore';
import { useMyChild } from '../../hooks/api/useProtectionApi';
import { KiddySync } from '../../services/KiddySync';
import { ApiError, api } from '../../lib/api/client';
import { useLockingStore } from '../../store/useLockingStore';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';

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
      style={[styles.row, active && styles.rowActive]}
    >
      <KText variant="body" style={{ flex: 1 }}>
        {item.appLabel ?? item.packageName}
      </KText>
      <View style={[styles.check, active && styles.checkActive]}>
        {active ? <Ionicons name="checkmark" size={16} color={WLIDI.white} /> : null}
      </View>
    </Pressable>
  );
});

export default function EditAppsScreen() {
  const router = useRouter();
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

  const onSave = async () => {
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
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: InstalledAppRow }) => (
      <AppRow item={item} active={selected.has(item.packageName)} onToggle={toggle} />
    ),
    [selected, toggle],
  );

  return (
    <KScreen scroll={false} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={WLIDI.text} />
        </Pressable>
        <KText variant="heading">Apps to block</KText>
        <KText variant="caption" muted style={{ marginTop: SPACING.xs }}>
          Choose apps on your child's device. These lock when blocking is ON.
        </KText>
      </View>

      {loadingApps ? (
        <ActivityIndicator color={WLIDI.teal} style={{ marginTop: SPACING.xl }} />
      ) : apps.length === 0 ? (
        <View style={styles.empty}>
          <KText variant="body" muted center>
            No apps yet. Finish permissions on the child's phone, then tap Refresh.
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
          contentContainerStyle={{ paddingBottom: SPACING.md }}
        />
      )}

      {error ? (
        <KText variant="caption" color="#E53935" style={{ marginTop: SPACING.sm }}>
          {error}
        </KText>
      ) : null}

      <KButton
        label={`Save (${selected.size} apps)`}
        size="lg"
        loading={saving}
        disabled={selected.size === 0 || apps.length === 0}
        onPress={() => void onSave()}
        style={{ marginTop: SPACING.md }}
      />
    </KScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: SPACING.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: WLIDI.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: WLIDI.outline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: WLIDI.white,
    borderWidth: 1.5,
    borderColor: WLIDI.outline,
  },
  rowActive: {
    backgroundColor: WLIDI.mint,
    borderColor: WLIDI.teal,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: WLIDI.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: WLIDI.teal,
    borderColor: WLIDI.teal,
  },
  empty: { flex: 1, justifyContent: 'center' },
});
