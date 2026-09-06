import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CONTENT_MAX_WIDTH } from '../components/Screen';
import { backdropBlur } from '../components/Card';
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
  Profile: ['ellipsis-horizontal-circle', 'ellipsis-horizontal-circle-outline'],
};

/** The bar's own height, before the safe-area gap underneath it. */
const BAR_HEIGHT = 66;

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

/**
 * A floating island bar rather than a full-width strip welded to the bottom
 * edge. The page scrolls underneath it and out past its sides, which is what
 * makes the app feel like it has depth instead of two stacked rectangles — and
 * on a desktop browser it keeps the chrome the same width as the content.
 */
export function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const floatGap = Math.max(insets.bottom, space(3));

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // A cross-fade between tabs, instead of the default hard cut.
        animation: 'fade',
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { ...type.caption, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: space(1.5) },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: BAR_HEIGHT,
          bottom: floatGap,
          paddingTop: space(1.5),
          paddingBottom: space(1.5),
          // Matches the capped content column so the bar does not run the full
          // width of a desktop browser window, with a gutter either side so it
          // reads as floating over the page rather than bolted to it.
          //
          // The navigator pins the bar with `start: 0`/`end: 0`, which makes it
          // absolutely positioned on both edges — `alignSelf` is ignored once
          // both insets are set, so the capped bar used to sit against the left
          // edge of a wide window instead of under the content column. Auto
          // horizontal margins are what actually centre an absolutely
          // positioned, width-capped box, in Yoga and in CSS alike.
          width: '90%',
          maxWidth: CONTENT_MAX_WIDTH - space(10),
          marginHorizontal: 'auto',
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.bar,
              theme.shadow.lg,
              {
                backgroundColor: theme.colors.glass,
                borderColor: theme.colors.glassBorder,
              },
            ]}
          />
        ),
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={route.name} focused={focused} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Meals" component={MealsScreen} options={{ title: '급식' }} />
      <Tab.Screen name="Cafeteria" component={CafeteriaScreen} options={{ title: '혼잡도' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '더보기' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 46,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    // Native cannot blur what is behind it, so the translucent fill above is
    // the whole effect there; the web build gets the real frost.
    ...backdropBlur,
    // A rounded bar has to clip its own fill, and on Android the shadow needs
    // the elevation that `overflow: hidden` would otherwise drop.
    ...Platform.select({ android: {}, default: { overflow: 'hidden' } }),
  },
});
