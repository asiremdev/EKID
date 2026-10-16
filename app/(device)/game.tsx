import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, View, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { SoftPlayBackground } from '../../components/ui/SoftPlayBackground';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { ageGroupMeta } from '../../constants/design';
import type { AgeGroup } from '../../lib/api/types';
import { deviceApi, DeviceApiError, type GameId, type GameStateResponse } from '../../lib/deviceApi';
import { WlidiSync } from '../../services/WlidiSync';
import { ColorGarden } from '../../components/games/ColorGarden';
import { NumberQuest } from '../../components/games/NumberQuest';
import { WordLab } from '../../components/games/WordLab';
import { LEVELS_PER_WORLD, WORLD_ACCENTS, worldIndexForLevel, worldMeta } from '../../components/games/worlds';
import { useChildStore } from '../../store/useChildStore';

const GAME_COMPONENTS: Record<
  GameId,
  React.ComponentType<{ level: number; onComplete: (score: number) => void }>
> = {
  COLOR_GARDEN: ColorGarden,
  NUMBER_QUEST: NumberQuest,
  WORD_LAB: WordLab,
};

export default function GameScreen() {
  const router = useRouter();
  const child = useChildStore((s) => s.child);
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deviceApi.getGameState();
      setState(data);
      const next = data.game.levels.find((l) => l.unlocked && !l.completed);
      setActiveLevel(next?.level ?? data.game.levels.find((l) => l.unlocked)?.level ?? 1);
    } catch (e) {
      const msg = e instanceof DeviceApiError ? e.message : 'Could not load game.';
      Alert.alert('Error', msg, [{ text: 'Back', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleComplete = async (score: number) => {
    if (!state || activeLevel === null) return;
    setSubmitting(true);
    try {
      const result = await deviceApi.completeGame({
        gameId: state.game.gameId,
        level: activeLevel,
        score,
      });
      await WlidiSync.afterGameComplete();
      if (result.starsEarned > 0) {
        Alert.alert('Level complete!', `You earned ${result.starsEarned} stars ⭐`);
      } else if (result.alreadyCompleted) {
        Alert.alert('Already done', 'You already completed this level.');
      }
      await load();
    } catch (e) {
      const msg = e instanceof DeviceApiError ? e.message : 'Could not save progress.';
      Alert.alert('Try again', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !state || activeLevel === null) {
    return (
      <View style={styles.loading}>
        <SoftPlayBackground />
        <ActivityIndicator color={WLIDI.teal} size="large" />
      </View>
    );
  }

  const GameComponent = GAME_COMPONENTS[state.game.gameId];
  const levelMeta = state.game.levels.find((l) => l.level === activeLevel);
  const ageMeta = child?.ageGroup ? ageGroupMeta(child.ageGroup as AgeGroup) : null;
  const allDone = state.game.levels.every((l) => l.completed);
  const world = worldMeta(state.game.gameId, activeLevel);
  const worldIdx = worldIndexForLevel(activeLevel);
  const worldLevels = state.game.levels.filter((l) => worldIndexForLevel(l.level) === worldIdx);

  return (
    <View style={styles.root}>
      <SoftPlayBackground />
      <View style={styles.inner}>
        <View style={styles.header}>
          <KButton label="← Back" variant="ghost" full={false} onPress={() => router.back()} />
          <KText variant="title" color={WLIDI.teal} style={{ marginTop: SPACING.sm }}>
            {state.game.title}
          </KText>
          <KText variant="caption" muted>
            {ageMeta ? `${ageMeta.range} yrs · ` : ''}
            {world.emoji} {world.title} · Level {activeLevel} of {state.game.levels.length}
            {levelMeta ? ` · +${levelMeta.starsReward} ⭐` : ''}
          </KText>

          <View style={styles.worldRow}>
            {WORLD_ACCENTS.map((accent, i) => {
              const chunk = state.game.levels.slice(i * LEVELS_PER_WORLD, (i + 1) * LEVELS_PER_WORLD);
              const done = chunk.length > 0 && chunk.every((l) => l.completed);
              const active = i === worldIdx;
              return (
                <View
                  key={accent}
                  style={[
                    styles.worldBar,
                    {
                      backgroundColor: done ? accent : active ? accent : WLIDI.outline,
                      opacity: done || active ? 1 : 0.35,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.progressRow}>
            {worldLevels.map((l) => (
              <View
                key={l.level}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: l.completed ? world.accent : l.level === activeLevel ? WLIDI.coral : WLIDI.outline,
                    opacity: l.unlocked ? 1 : 0.3,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {allDone ? (
          <View style={styles.center}>
            <KText style={{ fontSize: 64 }}>🏆</KText>
            <KText variant="heading" center style={{ marginTop: SPACING.md }}>
              All levels complete!
            </KText>
            <KButton label="Home" onPress={() => router.replace('/(device)/home')} style={{ marginTop: SPACING.xl, maxWidth: 240 }} />
          </View>
        ) : levelMeta?.completed ? (
          <View style={styles.center}>
            <KText variant="heading" center>
              Level {activeLevel} done ✓
            </KText>
            <KButton
              label="Next level"
              onPress={() => {
                const next = state.game.levels.find((l) => l.level > activeLevel && l.unlocked);
                if (next) setActiveLevel(next.level);
                else router.back();
              }}
              style={{ marginTop: SPACING.lg, maxWidth: 240 }}
            />
          </View>
        ) : (
          <View style={{ flex: 1, opacity: submitting ? 0.6 : 1 }}>
            <GameComponent
              key={activeLevel}
              level={activeLevel}
              onComplete={(score) => void handleComplete(score)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WLIDI.cream },
  loading: { flex: 1, backgroundColor: WLIDI.cream, alignItems: 'center', justifyContent: 'center' },
  inner: { flex: 1, paddingTop: SPACING.xxl },
  header: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  worldRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.md },
  worldBar: { flex: 1, height: 10, borderRadius: RADIUS.full },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
  progressDot: { flex: 1, height: 8, borderRadius: RADIUS.full },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
});
