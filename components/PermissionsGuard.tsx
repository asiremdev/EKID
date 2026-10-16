import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { useAppModeStore } from '../store/useAppModeStore';
import { deviceStorage } from '../lib/deviceStorage';
import { refreshAndCheckPermissions } from '../lib/permissions';
import { PermissionsModal } from './PermissionsModal';

/**
 * Re-checks Android permissions on child-device mode after pairing.
 */
export function PermissionsGuard() {
  const mode = useAppModeStore((s) => s.mode);
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const [visible, setVisible] = useState(false);
  const checkingRef = useRef(false);

  const segmentList = segments as string[];
  const onPairScreen = segmentList[0] === '(device)' && segmentList[1] === 'pair';
  const onPermissionsScreen = segmentList[0] === '(device)' && segmentList[1] === 'permissions';
  const onSetupScreen = segmentList[0] === 'setup';
  const onAuthScreen = segmentList[0] === '(auth)';

  const runCheck = async () => {
    if (Platform.OS !== 'android') return;
    if (mode !== 'child-device') return;
    if (onAuthScreen || onSetupScreen || onPairScreen || onPermissionsScreen) return;
    if (checkingRef.current) return;

    const token = await deviceStorage.getToken();
    if (!token) return;

    checkingRef.current = true;
    try {
      const { granted } = await refreshAndCheckPermissions();
      setVisible(!granted);
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    if (mode !== 'child-device') {
      setVisible(false);
      return;
    }
    if (status !== 'authed') return;
    void runCheck();
  }, [mode, status, onPairScreen, onPermissionsScreen, onSetupScreen, onAuthScreen]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runCheck();
    });
    return () => sub.remove();
  }, [mode, status, onPairScreen, onPermissionsScreen, onSetupScreen, onAuthScreen]);

  if (Platform.OS !== 'android' || mode !== 'child-device') return null;

  return (
    <PermissionsModal
      visible={visible}
      onDismiss={() => setVisible(false)}
      onAllGranted={() => setVisible(false)}
    />
  );
}
