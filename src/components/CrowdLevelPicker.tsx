import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, crowdScale, radius, space, type } from '../theme';
import type { CrowdLevel } from '../types';

interface CrowdLevelPickerProps {
  value: CrowdLevel;
  onChange: (level: CrowdLevel) => void;
}

/** Five tap targets covering the crowd scale, used when filing a report. */
export function CrowdLevelPicker({ value, onChange }: CrowdLevelPickerProps) {
  return (
    <View style={styles.row}>
      {crowdScale.map((step) => {
        const selected = step.level === value;
        return (
          <Pressable
            key={step.level}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${step.label} — ${step.detail}`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(step.level);
            }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? step.soft : colors.surface,
                borderColor: selected ? step.color : colors.border,
                borderWidth: selected ? 2 : 1,
              },
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.dots}>
              {crowdScale.map((dot) => (
                <View
                  key={dot.level}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        dot.level <= step.level ? step.color : colors.surfaceSunken,
                    },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[
                type.caption,
                styles.label,
                { color: selected ? step.color : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space(2) },
  option: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: space(3),
    paddingHorizontal: space(1),
    alignItems: 'center',
    gap: space(2),
  },
  pressed: { opacity: 0.8 },
  dots: { flexDirection: 'row', gap: 2 },
  dot: { width: 4, height: 12, borderRadius: 2 },
  label: { fontWeight: '600' },
});
