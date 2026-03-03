import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FindSquadScreen from '../screens/FindSquadScreen';
import RequestsScreen from '../screens/RequestsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: focused ? COLORS.primaryDim : 'transparent',
        }}
      >
        <View style={{ opacity: focused ? 1 : 0.5 }}>
          {/* emoji rendered as text via tab bar label */}
        </View>
      </View>
    </View>
  );
}

function MainTabs() {
  const { pendingRequestCount } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Rajdhani_600SemiBold',
          fontSize: 11,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'HOME',
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.5 }}>
              {/* Icon placeholder — use lucide-react-native in screen */}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="FindSquad"
        component={FindSquadScreen}
        options={{
          tabBarLabel: 'FIND SQUAD',
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.5 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarLabel: 'REQUESTS',
          tabBarBadge: pendingRequestCount > 0 ? pendingRequestCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
            color: COLORS.background,
            fontSize: 10,
            fontFamily: 'Orbitron_700Bold',
          },
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.5 }} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'PROFILE',
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.5 }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isLoading, uid, isOnboarded } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!uid ? (
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      ) : !isOnboarded ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
