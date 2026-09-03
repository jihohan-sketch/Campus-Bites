import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { CONTENT_MAX_WIDTH } from '../components/Screen';
import { USE_NATIVE_DRIVER } from '../components/motion';
import { CafeteriaScreen } from '../screens/main/CafeteriaScreen';
import { MealsScreen } from '../screens/main/MealsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { radius, space, type, useTheme } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<
  keyof MainTabParamList,
  [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]
> = {
  Meals: ['restaurant', 'restaurant-outline'],
  Cafeteria: ['people', 'people-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

/**
 * The selected tab's icon lifts and settles on a tinted pill, so switching
 * tabs has a physical result rather than only a colour change.
 */
function TabIcon({
  name,
  focused,
  color,
  size,
}: {
  name: keyof MainTabParamList;
  focused: boolean;
  color: string;
  size: number;
}) {
  const theme = useTheme();
  const lift = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 180,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [focused, lift]);

  const [active, inactive] = ICONS[name];

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        {
          backgroundColor: focused ? theme.colors.brandSoft : 'transparent',
          transform: [
            { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
          ],
        },
      ]}
    >
      <Ionicons name={focused ? active : inactive} size={size - 2} color={color} />
    </Animated.View>
  );
}

export function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // A cross-fade between tabs, instead of the default hard cut.
        animation: 'fade',
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { ...type.caption, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: space(1) },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: space(2),
          // Matches the capped content column so the bar does not run the full
          // width of a desktop browser window.
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        },
        // A frosted bar over a fade-to-background, so content scrolls under it.
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['transparent', theme.colors.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.55 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.bar,
                { backgroundColor: theme.colors.glass, borderTopColor: theme.colors.border },
              ]}
            />
          </View>
        ),
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={route.name} focused={focused} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Meals" component={MealsScreen} options={{ title: '급식' }} />
      <Tab.Screen name="Cafeteria" component={CafeteriaScreen} options={{ title: '혼잡도' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
});
