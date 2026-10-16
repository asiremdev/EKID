import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { LockBadge } from './StatusBadge';
import {
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { useAppLock } from '../hooks/useAppLock';
import type { LockedApp } from '../types';

interface LockedAppCardProps {
  app: LockedApp;
}

export const LockedAppCard = memo(function LockedAppCard({ app }: LockedAppCardProps) {
  const colors = useThemeColors();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('15');

  const {
    isLocked,
    isTimerUnlocked,
    remainingDisplay,
    handleUnlock,
    handleRelock,
    handleRemove,
  } = useAppLock(app.packageName);

  const confirmUnlock = useCallback(() => {
    const mins = parseInt(inputMinutes, 10);
    if (!isNaN(mins) && mins > 0) handleUnlock(mins);
    setShowUnlockModal(false);
  }, [inputMinutes, handleUnlock]);

  return (
    <>
      <View
        style={[
          styles.card,
          SHADOW.sm,
          {
            backgroundColor: colors.surface,
            borderColor: isLocked ? colors.error + '40' : colors.warning + '40',
          },
        ]}
      >
        <View style={styles.topRow}>
          <AppIcon appName={app.appName} packageName={app.packageName} size={48} />
          <View style={styles.info}>
            <Text style={[styles.appName, { color: colors.onSurface }]} numberOfLines={1}>
              {app.appName}
            </Text>
            <Text style={[styles.packageName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {app.packageName}
            </Text>
            <LockBadge status={app.status} />
          </View>
        </View>

        {isTimerUnlocked && remainingDisplay && (
          <View style={[styles.timerRow, { backgroundColor: colors.warning + '12' }]}>
            <Text style={[styles.timerText, { color: colors.warning }]}>
              ⏱ Relocks in {remainingDisplay}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {isLocked && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setShowUnlockModal(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.onPrimary }]}>Unlock</Text>
            </TouchableOpacity>
          )}
          {isTimerUnlocked && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.error + '18', borderColor: colors.error }]}
              onPress={handleRelock}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.error }]}>Relock</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline }]}
            onPress={handleRemove}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: colors.onSurfaceVariant }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showUnlockModal} transparent animationType="slide" onRequestClose={() => setShowUnlockModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowUnlockModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={[styles.modalCard, SHADOW.md, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Unlock Duration</Text>
              <Text style={[styles.modalSubtitle, { color: colors.onSurfaceVariant }]}>
                How long should {app.appName} stay unlocked?
              </Text>
              <View style={styles.quickPills}>
                {[5, 15, 30, 60].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: inputMinutes === String(m) ? colors.primary : colors.surfaceVariant,
                        borderColor: inputMinutes === String(m) ? colors.primary : colors.outline,
                      },
                    ]}
                    onPress={() => setInputMinutes(String(m))}
                  >
                    <Text style={{ color: inputMinutes === String(m) ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: '700' }}>
                      {m}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surfaceVariant }]}
                value={inputMinutes}
                onChangeText={setInputMinutes}
                keyboardType="numeric"
                placeholder="Minutes"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.outline }]} onPress={() => setShowUnlockModal(false)}>
                  <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={confirmUnlock}>
                  <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, alignItems: 'flex-start' },
  info: { flex: 1, gap: SPACING.xs },
  appName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  packageName: { fontSize: FONT_SIZE.xs },
  timerRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: RADIUS.md },
  timerText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  btn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, minWidth: 80, alignItems: 'center' },
  btnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  modalCard: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.md },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  modalSubtitle: { fontSize: FONT_SIZE.sm },
  quickPills: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  pill: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: FONT_SIZE.md },
  modalActions: { flexDirection: 'row', gap: SPACING.md, justifyContent: 'flex-end', marginTop: SPACING.xs },
  modalBtn: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1.5 },
});
