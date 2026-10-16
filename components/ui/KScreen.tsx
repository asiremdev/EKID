import React from 'react';
import { ScrollView, View, ViewStyle, RefreshControlProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, WLIDI } from '../../constants/theme';
import { SoftPlayBackground } from './SoftPlayBackground';

interface KScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  decor?: boolean;
}

export function KScreen({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
  refreshControl,
  edges = ['top'],
  decor = true,
}: KScreenProps) {
  const pad = padded ? styles.pad : undefined;

  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {decor ? <SoftPlayBackground /> : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          removeClippedSubviews
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WLIDI.cream },
  flex: { flex: 1 },
  pad: { padding: SPACING.md },
  scrollContent: { paddingBottom: SPACING.xxl + 72 },
});
