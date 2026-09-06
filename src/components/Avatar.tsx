import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

interface AvatarProps {
  emoji: string;
  /**
   * The student's profile photo, when they signed in with Google. Empty for
   * email accounts, and a photo that fails to load falls back to the emoji —
   * an avatar always renders something.
   */
  photoUrl?: string;
  size?: number;
  /** Ring colour used to signal a status, e.g. a crowd reading. */
  ringColor?: string;
  background?: string;
  /** Adds a soft halo in the ring colour — for the "this one is live" avatar. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  emoji,
  photoUrl,
  size = 44,
  ringColor,
  background,
  glow = false,
  style,
}: AvatarProps) {
  const theme = useTheme();
  // Google photo URLs expire and hotlinking can be blocked, so a broken image
  // must degrade to the emoji rather than leaving a hole in the row.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background ?? theme.colors.surfaceMuted,
          borderWidth: ringColor ? 2 : StyleSheet.hairlineWidth,
          borderColor: ringColor ?? theme.colors.border,
        },
        glow && ringColor
          ? {
              shadowColor: ringColor,
              shadowOpacity: 0.55,
              shadowRadius: size * 0.3,
              shadowOffset: { width: 0, height: 0 },
            }
          : null,
        style,
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          onError={() => setPhotoFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
