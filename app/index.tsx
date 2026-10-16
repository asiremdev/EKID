import { View, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../constants/ThemeContext';
import { KText } from '../components/ui/KText';

export default function Index() {
  const colors = useThemeColors();
  // AuthGate (root layout) performs the actual redirect once auth is hydrated.
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <KText style={{ fontSize: 64, marginBottom: 16 }}>🌟</KText>
      <KText variant="title" color={colors.primary}>
        WLIDI
      </KText>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}
