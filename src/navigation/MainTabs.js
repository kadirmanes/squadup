import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import MapScreen from '../screens/MapScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const SCREEN_MAP = {
  Plan:    DashboardScreen,
  Map:     MapScreen,
  Chat:    ChatScreen,
  Profile: ProfileScreen,
};

const TABS = [
  { name: 'Plan',    label: 'Plan',    emoji: '🗓️', emojiActive: '📋' },
  { name: 'Map',     label: 'Harita',  emoji: '🗺️', emojiActive: '🗺️' },
  { name: 'Chat',    label: 'AI',      emoji: '🤖', emojiActive: '🤖' },
  { name: 'Profile', label: 'Profil',  emoji: '🧭', emojiActive: '🧭' },
];

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBarStyle,
        tabBarShowLabel: false,
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={SCREEN_MAP[tab.name]}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                emoji={focused ? tab.emojiActive : tab.emoji}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const tabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0,
  height: Platform.OS === 'ios' ? 88 : 68,
  paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  paddingTop: 8,
  paddingHorizontal: Spacing.md,
  ...Shadow.lg,
};

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryFaded,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
});
