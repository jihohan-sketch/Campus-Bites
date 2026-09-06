import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { SelectedDateProvider } from './src/context/SelectedDateContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          {/* 급식 and 혼잡도 are two views of the same day, so the day they
              are looking at lives above both of them. */}
          <SelectedDateProvider>
            {/* `auto` flips the bar contents with the OS appearance. */}
            <StatusBar style="auto" />
            <RootNavigator />
          </SelectedDateProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
