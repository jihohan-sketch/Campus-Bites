import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Apply the top safe-area inset. Off for screens with their own header. */
  topInset?: boolean;
  bottomInset?: boolean;
  style?: ViewStyle;
}

/** Root container that owns the page background and safe-area padding. */
export function Screen({ children, topInset = true, bottomInset = false, style }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: topInset ? insets.top : 0,
          paddingBottom: bottomInset ? insets.bottom : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
