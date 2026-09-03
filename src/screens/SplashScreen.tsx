import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_SCHOOL_SHORT } from '../config/school';
import { colors, space, type } from '../theme';

/** Shown while the persisted Firebase session is restored. */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍚</Text>
      <Text style={[type.title, styles.title]}>{APP_SCHOOL_SHORT} 급식</Text>
      <ActivityIndicator color={colors.brand} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: space(2),
  },
  emoji: { fontSize: 56 },
  title: { color: colors.text },
  spinner: { marginTop: space(4) },
});
