
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const tabIcons: Record<string, string> = {
  index: '⌂',
  scan: '▣',
  medications: '✚',
  history: '▤',
  profile: '♙',
};

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EAF0F4',
          borderTopWidth: 1,
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ color }) => (
          <Text
            style={{
              color,
              fontSize: 21,
              fontWeight: '700',
            }}
          >
            {tabIcons[route.name] || '•'}
          </Text>
        ),
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />

      <Tabs.Screen
        name="scan"
        options={{ title: 'Scan' }}
      />

      <Tabs.Screen
        name="medications"
        options={{ title: 'Medicines' }}
      />

      <Tabs.Screen
        name="history"
        options={{ title: 'History' }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}
