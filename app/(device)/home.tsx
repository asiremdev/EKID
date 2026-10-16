import React, { useCallback, useRef } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { WlidiLogo } from '../../components/ui/WlidiLogo';
import { FoxAvatar, StarBadge } from '../../components/ui/WlidiDecor';
import { SoftPlayBackground } from '../../components/ui/SoftPlayBackground';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { useLockingStore } from '../../store/useLockingStore';
import { useChildStore } from '../../store/useChildStore';
import { ageGroupMeta } from '../../constants/design';
import { IMAGES } from '../../constants/assets';
import { deviceStorage } from '../../lib/deviceStorage';
import { WlidiSync } from '../../services/WlidiSync';
import { GAME_WORLDS, WORLD_ACCENTS, gameIdForAge } from '../../components/games/worlds';
import { Chip } from '../../components/ui/Chip';
import type { AgeGroup } from '../../lib/api/types';

export default function DeviceHomeScreen() {
  const router = useRouter();
  const stars = useLockingStore((s) => s.starBalance);
  const child = useChildStore((s) => s.child);
  const ageMeta = child?.ageGroup ? ageGroupMeta(child.ageGroup as AgeGroup) : null;
  const synced = useRef(false);

  const gameImage =
    ageMeta?.game === 'Color Garden'
      ? IMAGES.colorGarden
      : ageMeta?.game === 'Word Lab'
        ? IMAGES.wordLab
        : IMAGES.numberQuestBlocks;

  useFocusEffect(
    useCallback(() => {
      void deviceStorage.getToken().then((token) => {
        if (!token) router.replace('/(device)/pair');
        else if (!synced.current) {
          synced.current = true;
          void WlidiSync.pull().catch(() => {});
        }
      });
    }, [router]),
  );

  const worlds = GAME_WORLDS[gameIdForAge(child?.ageGroup)];

  return (
    <View style={styles.root}>
      <SoftPlayBackground />

      <View style={styles.topBar}>
        <WlidiLogo size="sm" />
        <Pressable style={styles.settingsBtn} onPress={() => router.push('/(device)/permissions')}>
          <Ionicons name="settings-outline" size={22} color={WLIDI.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <FoxAvatar size={88} />
        <KText variant="title" style={styles.welcome}>
          Welcome {child?.name ?? 'Friend'}!
        </KText>
        <StarBadge stars={stars} large style={{ marginTop: SPACING.sm }} />

        <View style={styles.worldChips}>
          {worlds.map((world, i) => (
            <Chip key={world.title} label={`W${i + 1}`} emoji={world.emoji} color={WORLD_ACCENTS[i]} />
          ))}
        </View>

        <View style={styles.challengeCard}>
          <KText variant="caption" muted>
            Next Challenge!
          </KText>
          <KText variant="display" style={styles.gameTitle}>
            {ageMeta?.game ?? 'Learning Game'}
          </KText>
          <Image source={gameImage} style={styles.gameImage} resizeMode="contain" />
          <KButton
            label="Play"
            icon="▶"
            size="lg"
            onPress={() => router.push('/(device)/game')}
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WLIDI.cream,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxl,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: WLIDI.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: WLIDI.outline,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  welcome: {
    marginTop: SPACING.md,
    fontWeight: '700',
    color: WLIDI.text,
  },
  challengeCard: {
    width: '100%',
    marginTop: SPACING.xl,
    backgroundColor: WLIDI.mint,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WLIDI.mintDark,
  },
  gameTitle: {
    color: WLIDI.teal,
    fontWeight: '800',
    fontSize: 28,
    marginVertical: SPACING.xs,
  },
  gameImage: {
    width: '100%',
    height: 130,
    borderRadius: RADIUS.lg,
  },
  worldChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
});
