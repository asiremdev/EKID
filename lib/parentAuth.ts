import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type ParentAuthMethod = 'fingerprint' | 'face' | 'iris' | 'pin' | 'unknown';

export interface ParentAuthResult {
  ok: boolean;
  method?: ParentAuthMethod;
  error?: string;
}

function mapAuthTypes(types: LocalAuthentication.AuthenticationType[]): ParentAuthMethod {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
  return 'pin';
}

export function parentAuthMethodLabel(method: ParentAuthMethod): string {
  switch (method) {
    case 'face':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
    case 'fingerprint':
      return 'Fingerprint';
    case 'iris':
      return 'Iris scan';
    case 'pin':
      return 'Phone PIN / pattern';
    default:
      return 'Device lock';
  }
}

/** Check whether the device can verify the parent (biometrics or device PIN). */
export async function getParentAuthCapability(): Promise<{
  available: boolean;
  method: ParentAuthMethod;
  hint: string;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const method = mapAuthTypes(types);

  if (!hasHardware && !enrolled) {
    return {
      available: true,
      method: 'pin',
      hint: 'Use the same PIN or pattern you use to unlock this phone.',
    };
  }

  if (!enrolled) {
    return {
      available: true,
      method: 'pin',
      hint: 'Use your phone PIN, pattern, or password to continue.',
    };
  }

  return {
    available: true,
    method,
    hint: `Use ${parentAuthMethodLabel(method)} — the same way you unlock your phone.`,
  };
}

/**
 * Prompts the device lock screen (fingerprint, face, or PIN/pattern).
 * Same credential the parent uses to unlock the phone from the lock screen.
 */
export async function verifyParentIdentity(): Promise<ParentAuthResult> {
  try {
    const capability = await getParentAuthCapability();
    if (!capability.available) {
      return { ok: false, error: 'This device cannot verify your identity.' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify parent to turn off protection',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use phone PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { ok: true, method: capability.method };
    }

    if (result.error === 'user_cancel' || result.error === 'system_cancel') {
      return { ok: false, error: 'Verification cancelled.' };
    }

    return { ok: false, error: 'Verification failed. Try again.' };
  } catch {
    return { ok: false, error: 'Could not open device verification.' };
  }
}
