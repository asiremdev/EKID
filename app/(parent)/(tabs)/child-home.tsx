import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../../components/ui/KScreen';
import { KText } from '../../../components/ui/KText';
import { KButton } from '../../../components/ui/KButton';
import { KCard } from '../../../components/ui/KCard';
import { FoxAvatar, StarBadge } from '../../../components/ui/WlidiDecor';
import { SPACING, WLIDI, RADIUS } from '../../../constants/theme';
import { ageGroupMeta } from '../../../constants/design';
import { IMAGES } from '../../../constants/assets';
import { Image } from 'react-native';
import { Chip } from '../../../components/ui/Chip';
import { GAME_WORLDS, WORLD_ACCENTS, gameIdForAge } from '../../../components/games/worlds';
import { useChildStore } from '../../../store/useChildStore';
import { useChildren } from '../../../hooks/api/useChildrenApi';
import { useLockingStore } from '../../../store/useLockingStore';

export default function ChildHomeTab() {
  const router = useRouter();
  const child = useChildStore((s) => s.child);
  const setChild = useChildStore((s) => s.setChild);
  const { data: children } = useChildren();
  const profile = child ?? children?.[0];
  const syncBundle = useLockingStore((s) => s.syncBundle);
  const ageMeta = profile?.ageGroup ? ageGroupMeta(profile.ageGroup) : null;
  const worlds = GAME_WORLDS[gameIdForAge(profile?.ageGroup)];

  const gameImage =
    ageMeta?.game === 'Color Garden'
      ? IMAGES.colorGarden
      : ageMeta?.game === 'Word Lab'
        ? IMAGES.wordLab
        : IMAGES.numberQuestBlocks;

  return (
    <KScreen>
      <KText variant="caption" muted>
        Child overview
      </KText>
      <KText variant="heading" style={{ marginBottom: SPACING.lg }}>
        {profile?.name ?? 'Your child'}
      </KText>

      {children && children.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md }}>
          {children.map((c) => (
            <Chip key={c.id} label={c.name} active={profile?.id === c.id} onPress={() => setChild(c)} />
          ))}
        </View>
      ) : null}

      {profile ? (
        <>
          <View style={styles.profileRow}>
            <FoxAvatar size={80} />
            <View style={{ marginLeft: SPACING.md }}>
              <KText variant="title">Welcome {profile.name}!</KText>
              <StarBadge stars={profile.stars ?? 0} large style={{ marginTop: SPACING.sm }} />
            </View>
          </View>

          <KCard color={WLIDI.mint} style={styles.challengeCard}>
            <KText variant="caption" muted>
              Next Challenge!
            </KText>
            <KText variant="display" style={styles.gameTitle}>
              {ageMeta?.game ?? 'Learning Game'}
            </KText>
            <Image source={gameImage} style={styles.gameImage} resizeMode="contain" />
            <View style={styles.worldChips}>
              {worlds.map((world, i) => (
                <Chip key={world.title} label={world.title} emoji={world.emoji} color={WORLD_ACCENTS[i]} />
              ))}
            </View>
            <KText variant="caption" muted center style={{ marginTop: SPACING.sm }}>
              50 levels across 5 worlds · this is what your child sees
            </KText>
          </KCard>

          <KCard color={WLIDI.white} style={{ marginTop: SPACING.md }}>
            <KText variant="label">Current rules</KText>
            <KText variant="body" muted style={{ marginTop: SPACING.xs }}>
              {syncBundle?.defaultRule
                ? `${syncBundle.defaultRule.starsRequired} ⭐ = ${syncBundle.defaultRule.minutesGranted} min unlock`
                : 'No rules set yet'}
            </KText>
          </KCard>
        </>
      ) : (
        <KText muted>No child profile yet. Complete onboarding first.</KText>
      )}

      <KButton
        label="Edit reward rules"
        variant="sky"
        onPress={() => router.push('/(parent)/edit-rules')}
        style={{ marginTop: SPACING.xl }}
      />
    </KScreen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  challengeCard: {
    borderColor: WLIDI.mintDark,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  gameTitle: {
    color: WLIDI.teal,
    fontWeight: '800',
    marginVertical: SPACING.sm,
  },
  gameImage: {
    width: '100%',
    height: 140,
    borderRadius: RADIUS.lg,
  },
  worldChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
});
