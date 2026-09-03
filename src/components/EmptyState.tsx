import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { Button } from './Button';
import { FadeIn } from './motion';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Colours the halo behind the emoji. Defaults to the brand accent. */
  tint?: string;
}

/**
 * "Nothing here yet", made to look intentional: the emoji sits in a tinted
 * halo so the empty screen has a focal point instead of a hole in the middle.
 */
export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  tint,
}: EmptyStateProps) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const accent = tint ?? theme.colors.brand;

  return (
    <FadeIn>
      <View style={styles.container}>
        <View style={styles.halo}>
          <LinearGradient
            colors={[accent, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.haloFill]}
          />
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <Text style={[text.heading, styles.title]}>{title}</Text>
        <Text style={[text.body, styles.description]}>{description}</Text>

        {actionLabel && onAction ? (
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="tonal"
            size="md"
            tint={accent}
            style={styles.action}
          />
        ) : null}
      </View>
    </FadeIn>
  );
}

const HALO = 104;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: space(10),
      paddingHorizontal: space(6),
      gap: space(2),
    },
    halo: {
      width: HALO,
      height: HALO,
      borderRadius: HALO / 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginBottom: space(3),
      backgroundColor: t.colors.surfaceMuted,
    },
    haloFill: { opacity: t.isDark ? 0.2 : 0.16, borderRadius: HALO / 2 },
    emoji: { fontSize: 44 },
    title: { color: t.colors.text, textAlign: 'center' },
    description: {
      color: t.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    action: { marginTop: space(4), borderRadius: radius.pill, paddingHorizontal: space(6) },
  });
