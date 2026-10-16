import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS_LIGHT, WLIDI } from '../constants/theme';
import { ThemeProvider } from '../constants/ThemeContext';
import { QueryProvider } from '../lib/query/QueryProvider';
import { RootGate } from '../components/RootGate';
import { DeviceProtectionEngine } from '../components/DeviceProtectionEngine';
import { DeviceLockOverlay } from '../components/DeviceLockOverlay';
import { PermissionsGuard } from '../components/PermissionsGuard';
import { useAppModeStore } from '../store/useAppModeStore';

/** WLIDI — one app, parent mode or child-device mode. */
export default function RootLayout() {
  const mode = useAppModeStore((s) => s.mode);
  const hydrate = useAppModeStore((s) => s.hydrate);
  const isChildDevice = mode === 'child-device';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            {isChildDevice ? (
              <>
                <DeviceProtectionEngine />
                <DeviceLockOverlay />
              </>
            ) : null}
            <PermissionsGuard />
            <RootGate />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: WLIDI.cream },
                animation: 'fade',
              }}
            />
            <StatusBar style="dark" />
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
