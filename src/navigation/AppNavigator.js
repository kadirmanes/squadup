import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import OnboardingScreen     from '../screens/OnboardingScreen';
import GeneratingScreen     from '../screens/GeneratingScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import PackingListScreen    from '../screens/PackingListScreen';
import PersonalInfoScreen   from '../screens/PersonalInfoScreen';
import MainTabs             from './MainTabs';
import { Routes }          from './routes';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {!user ? (
          // ── Auth screens ─────────────────────────────────────────────────────
          <>
            <Stack.Screen
              name={Routes.LOGIN}
              component={LoginScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name={Routes.REGISTER}
              component={RegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          // ── App screens ──────────────────────────────────────────────────────
          <>
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
            <Stack.Screen
              name={Routes.PERSONAL_INFO}
              component={PersonalInfoScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
