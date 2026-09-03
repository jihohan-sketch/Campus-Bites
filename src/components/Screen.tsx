import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStyles, useTheme, type Theme } from '../theme';

/**
 * This is a phone layout. On a wide browser window the cards would otherwise
 * stretch the full width of the screen, so the content is capped and centred
 * at roughly a large phone's width.
 */
export const CONTENT_MAX_WIDTH = 560;

interface ScreenProps {
  children: React.ReactNode;
  /** Apply the top safe-area inset. Off for screens with their own header. */
  topInset?: boolean;
  bottomInset?: boolean;
  /**
   * Tints the top of the page — pass the accent of whatever the screen is
   * about (the current meal, say) and the whole page picks up its temperature.
   */
  bloom?: string;
  style?: ViewStyle;
}

/** Root container that owns the page wash and the safe-area padding. */
export function Screen({
  children,
  topInset = true,
  bottomInset = false,
  bloom,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <View style={[styles.root, style]}>
      {/* A barely-there vertical wash keeps flat white cards from floating on
          an equally flat background. */}
      <LinearGradient
        colors={[theme.colors.backgroundAlt, theme.colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {bloom ? (
        <LinearGradient
          colors={[bloom, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bloom, { opacity: theme.colors.bloomOpacity }]}
          pointerEvents="none"
        />
      ) : null}

      <View
        style={[
          styles.container,
          {
            paddingTop: topInset ? insets.top : 0,
            paddingBottom: bottomInset ? insets.bottom : 0,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    bloom: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 420,
    },
    container: {
      flex: 1,
      // Above the wash and the bloom, which are absolutely positioned.
      zIndex: 1,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
  });
