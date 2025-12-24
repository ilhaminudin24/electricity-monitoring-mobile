import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    paddingTop: 8,
                    // Add padding for Android navigation bar
                    paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) + 8 : 8,
                    height: Platform.OS === 'android' ? 60 + Math.max(insets.bottom, 8) : 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => (
                        <TabIcon name="📊" />
                    ),
                }}
            />
            <Tabs.Screen
                name="input"
                options={{
                    title: 'Input',
                    tabBarIcon: ({ color }) => (
                        <TabIcon name="⚡" />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => (
                        <TabIcon name="📋" />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => (
                        <TabIcon name="⚙️" />
                    ),
                }}
            />
        </Tabs>
    );
}

// Simple emoji-based tab icon (will replace with Lucide icons later)
function TabIcon({ name }: { name: string }) {
    return <Text style={{ fontSize: 20 }}>{name}</Text>;
}
