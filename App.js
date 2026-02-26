/**
 * NomadWise AI
 * AI-powered travel assistant for caravan, camping & hotel adventures.
 *
 * Entry point — mounts navigation container and global providers.
 */

import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { TripProvider } from './src/context/TripContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TripProvider>
        <StatusBar style="dark" backgroundColor="#F5F0E8" />
        <AppNavigator />
      </TripProvider>
    </GestureHandlerRootView>
  );
}
