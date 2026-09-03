import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';

import { useAuth } from '../context/AuthContext';
import { AddFriendScreen } from '../screens/main/AddFriendScreen';
import { CrowdReportScreen } from '../screens/main/CrowdReportScreen';
import { EditProfileScreen } from '../screens/main/EditProfileScreen';
import { MealDetailScreen } from '../screens/main/MealDetailScreen';
import { SchoolSetupScreen } from '../screens/onboarding/SchoolSetupScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { type, useTheme } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Guest-first navigation: 급식표 opens immediately with no login or setup.
 * Sign-in is optional and only needed for crowd reports, friends, and radar.
 */
export function RootNavigator() {
  const { initializing } = useAuth();
  const theme = useTheme();

  const navigationTheme = useMemo<NavigationTheme>(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.brand,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.brand,
      },
    };
  }, [theme]);

  if (initializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerTitleStyle: {
            fontFamily: type.heading.fontFamily,
            fontSize: type.subheading.fontSize,
            fontWeight: type.heading.fontWeight,
          },
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="MealDetail"
          component={MealDetailScreen}
          options={{ title: '' }}
        />

        <Stack.Group screenOptions={{ headerShown: false, presentation: 'modal' }}>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Group>

        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen
            name="CrowdReport"
            component={CrowdReportScreen}
            options={{ title: '혼잡도 제보' }}
          />
          <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: '친구' }} />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: '프로필 수정' }}
          />
        </Stack.Group>

        <Stack.Screen
          name="SchoolSetup"
          component={SchoolSetupScreen}
          options={{ title: '학년·반' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
