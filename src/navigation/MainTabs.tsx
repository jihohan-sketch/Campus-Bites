import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform } from 'react-native';

import { CafeteriaScreen } from '../screens/main/CafeteriaScreen';
import { MealsScreen } from '../screens/main/MealsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { RadarScreen } from '../screens/main/RadarScreen';
import { colors, type } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Meals: ['restaurant', 'restaurant-outline'],
  Cafeteria: ['people', 'people-outline'],
  Radar: ['radio', 'radio-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...type.caption, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Meals" component={MealsScreen} options={{ title: '급식' }} />
      <Tab.Screen name="Cafeteria" component={CafeteriaScreen} options={{ title: '혼잡도' }} />
      <Tab.Screen name="Radar" component={RadarScreen} options={{ title: '친구 레이더' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  );
}
