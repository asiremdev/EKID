import { Stack } from 'expo-router';

export default function ParentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-apps" options={{ presentation: 'card' }} />
      <Stack.Screen name="edit-rules" options={{ presentation: 'card' }} />
    </Stack>
  );
}
