import AuthGate from '../components/AuthGate';

import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const icons: Record<string, string> = {
  index: '⌂',
  scan: '＋',
  medications: '▤',
  reminders: '◷',
  history: '◷',
  profile: '○',
};

export default function RootLayout() {
  return (
    <AuthGate>
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5EDF2',
          height: 66,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 21 }}>
            {icons[route.name] || '•'}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="medications" options={{ title: 'Medicines' }} />
      <Tabs.Screen name="reminders" options={{ title: 'Reminders' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
    </AuthGate>
  );
}
