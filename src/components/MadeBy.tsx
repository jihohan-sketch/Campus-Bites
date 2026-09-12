import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { space, type as text, useStyles, type Theme } from '../theme';

interface MadeByProps {
  style?: ViewStyle;
}

/**
 * The signature that closes every page.
 *
 * Deliberately quiet — a hairline, a bowl, two muted lines — so it reads as
 * the end of the content rather than one more card competing with it.
 */
export function MadeBy({ style }: MadeByProps) {
  const styles = useStyles(makeStyles);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <View style={styles.rule}>
        <View style={styles.line} />
        <Text style={styles.mark}>🍚</Text>
        <View style={styles.line} />
      </View>

      <Text style={[text.caption, styles.credit]}>made by 먹는거에 진심인 사람</Text>
      <Text style={[text.label, styles.name]}>Sean Jiho Han</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { alignItems: 'center', gap: space(1), paddingTop: space(2) },
    rule: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: space(3),
      marginBottom: space(2),
    },
    line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border },
    mark: { fontSize: 13, opacity: 0.8 },
    credit: { color: t.colors.textMuted, textAlign: 'center' },
    name: { color: t.colors.textSecondary, textAlign: 'center', letterSpacing: 0.4 },
  });
