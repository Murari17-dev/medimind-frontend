import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import AuthGate from '@/components/AuthGate';
import { DueRemindersBanner } from '@/components/due-reminders-banner';
import { Colors } from '@/constants/colors';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; title: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'scan', title: 'Scan', icon: 'scan-outline', activeIcon: 'scan' },
  { name: 'medications', title: 'Medicines', icon: 'medkit-outline', activeIcon: 'medkit' },
  { name: 'reminders', title: 'Reminders', icon: 'alarm-outline', activeIcon: 'alarm' },
  { name: 'history', title: 'History', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function RootLayout() {
  return (
    <AuthGate>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <DueRemindersBanner />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.inactive,
            tabBarStyle: {
              backgroundColor: Colors.surface,
              borderTopColor: Colors.border,
              height: 68,
              paddingTop: 6,
              paddingBottom: 8,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarLabelPosition: 'below-icon',
          }}
        >
          {TABS.map((tab) => (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarIcon: ({ color, focused, size }) => (
                  <Ionicons
                    name={focused ? tab.activeIcon : tab.icon}
                    size={size}
                    color={color as string}
                  />
                ),
              }}
            />
          ))}
        </Tabs>
      </View>
    </AuthGate>
  );
}
