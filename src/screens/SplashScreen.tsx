import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { USE_NATIVE_DRIVER } from '../components/motion';
import { APP_NAME } from '../config/school';
import { space, type as text, useStyles, useTheme, type Theme } from '../theme';

/** Shown while the persisted Firebase session is restored. */
export function SplashScreen() {
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [rise]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.backgroundAlt, theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.stack,
          {
            opacity: rise,
            transform: [
              { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          },
        ]}
      >
        <Text style={styles.emoji}>🍚</Text>
        <Text style={[text.title, styles.title]}>{APP_NAME}</Text>
      </Animated.View>

      <ActivityIndicator color={theme.colors.brand} style={styles.spinner} />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.background,
    },
    stack: { alignItems: 'center', gap: space(2) },
    emoji: { fontSize: 56 },
    title: { color: t.colors.text },
    spinner: { marginTop: space(6) },
  });
