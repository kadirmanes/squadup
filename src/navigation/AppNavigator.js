import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import FindSquadScreen from '../screens/FindSquadScreen';
import RequestsScreen from '../screens/RequestsScreen';
import SquadsScreen from '../screens/SquadsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlayerProfileScreen from '../screens/PlayerProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, label, focused, badge }) {
  return (
    <View style={tabStyles.iconWrapper}>
      {focused && <View style={tabStyles.activeBar} />}
      <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxActive]}>
        <Text style={[tabStyles.emoji, { opacity: focused ? 1 : 0.45 }]}>{emoji}</Text>
      </View>
      <Text
        style={[
          tabStyles.label,
          { color: focused ? COLORS.primary : COLORS.textMuted, opacity: focused ? 1 : 0.6 },
        ]}
      >
        {label}
      </Text>
      {badge > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    paddingTop: 6,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  iconBox: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconBoxActive: {
    backgroundColor: COLORS.primaryDim ?? 'rgba(99,102,241,0.15)',
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Orbitron_700Bold',
  },
});

function MainTabs() {
  const { pendingRequestCount, pendingFriendRequestCount } = useApp();
  const totalPendingCount = pendingRequestCount + pendingFriendRequestCount;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 6,
          paddingTop: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="HOME" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="FindSquad"
        component={FindSquadScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="FIND" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📬" label="REQUESTS" focused={focused} badge={totalPendingCount} />
          ),
        }}
      />
      <Tab.Screen
        name="Squads"
        component={SquadsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎮" label="SQUADS" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="PROFILE" focused={focused} />
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
        // Giriş yapılmamış → Splash + Login
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        </>
      ) : !isOnboarded ? (
        // Giriş yapılmış ama profil yok → Onboarding
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        </>
      ) : (
        // Tam giriş → Ana uygulama
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'slide_from_right', gestureEnabled: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} options={{ animation: 'slide_from_right' }} />
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
