import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { CrowdLevel } from '../types';
import { PressableScale } from './motion';

interface CrowdLevelPickerProps {
  value: CrowdLevel;
  onChange: (level: CrowdLevel) => void;
}

/** Five tap targets covering the crowd scale, used when filing a report. */
export function CrowdLevelPicker({ value, onChange }: CrowdLevelPickerProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.row}>
      {t.crowd.map((step) => {
        const selected = step.level === value;
        return (
          <PressableScale
            key={step.level}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${step.label} — ${step.detail}`}
            scaleTo={0.93}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(step.level);
            }}
            style={[
              styles.option,
              {
                backgroundColor: selected ? step.soft : t.colors.surface,
                borderColor: selected ? step.color : t.colors.border,
                borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
              },
              selected ? t.shadow.xs : null,
            ]}
          >
            {/* A five-bar mini meter, so the option previews the reading it
                would file rather than relying on the label alone. */}
            <View style={styles.dots}>
              {t.crowd.map((dot) => (
                <View
                  key={dot.level}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        dot.level <= step.level
                          ? selected
                            ? step.color
                            : t.colors.borderStrong
                          : t.colors.track,
                    },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[
                text.caption,
                styles.label,
                { color: selected ? step.color : t.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (_t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: space(2) },
    option: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: space(3.5),
      paddingHorizontal: space(1),
      alignItems: 'center',
      gap: space(2),
    },
    dots: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
    dot: { width: 4, height: 14, borderRadius: 2 },
    label: { fontWeight: '700' },
  });
