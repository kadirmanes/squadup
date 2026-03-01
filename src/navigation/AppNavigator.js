import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import GeneratingScreen from '../screens/GeneratingScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import PackingListScreen from '../screens/PackingListScreen';
import MainTabs from './MainTabs';
import { Routes } from './routes';

const Stack = createNativeStackNavigator();

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
        <Stack.Screen
          name={Routes.ONBOARDING}
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name={Routes.GENERATING}
          component={GeneratingScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen
          name={Routes.MAIN}
          component={MainTabs}
          options={{ animation: 'fade_from_bottom' }}
        />
        <Stack.Screen
          name={Routes.ACTIVITY_DETAIL}
          component={ActivityDetailScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name={Routes.PACKING_LIST}
          component={PackingListScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
