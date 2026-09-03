import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Consistent "nothing here yet" panel with an optional next step. */
export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[type.subheading, styles.title]}>{title}</Text>
      <Text style={[type.body, styles.description]}>{description}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: space(9),
    paddingHorizontal: space(6),
    gap: space(2),
  },
  emoji: { fontSize: 40, marginBottom: space(1) },
  title: { color: colors.text, textAlign: 'center' },
  description: { color: colors.textSecondary, textAlign: 'center' },
  action: { marginTop: space(3) },
});
