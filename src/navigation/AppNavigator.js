import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export const Routes = {
  ONBOARDING: 'Onboarding',
  MAIN: 'Main',
  ACTIVITY_DETAIL: 'ActivityDetail',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={Routes.ONBOARDING}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F0E8' },
        }}
      >
        {/* Onboarding — full screen entry */}
        <Stack.Screen
          name={Routes.ONBOARDING}
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />

        {/* Main app with bottom tabs */}
        <Stack.Screen
          name={Routes.MAIN}
          component={MainTabs}
          options={{ animation: 'fade_from_bottom' }}
        />

        {/* Activity detail — bottom sheet modal */}
        <Stack.Screen
          name={Routes.ACTIVITY_DETAIL}
          component={ActivityDetailScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
