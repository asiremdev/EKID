import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { WLIDI } from '../../constants/theme';
import { SoftPlayBackground } from '../../components/ui/SoftPlayBackground';

export default function DeviceLayout() {
  return (
    <View style={styles.root}>
      <SoftPlayBackground />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WLIDI.cream },
  flex: { flex: 1 },
});
