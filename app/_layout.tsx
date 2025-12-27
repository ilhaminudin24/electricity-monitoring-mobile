import "../global.css";
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/constants/colors';

function RootLayoutNav() {
    const { user, initialized } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [forceShow, setForceShow] = useState(false);

    // Fallback timeout - if not initialized after 3 seconds, show anyway
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!initialized) {
                console.log('Forcing show after timeout');
                setForceShow(true);
            }
        }, 3000);

        return () => clearTimeout(timeout);
    }, [initialized]);

    // Handle navigation based on auth state
    useEffect(() => {
        const ready = initialized || forceShow;
        if (!ready) return;

        const inAuthGroup = segments[0] === '(auth)';

        console.log('Navigation check:', { user: !!user, inAuthGroup, segments: segments[0] });

        if (!user && !inAuthGroup) {
            console.log('Redirecting to login...');
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            console.log('Redirecting to tabs...');
            router.replace('/(tabs)');
        }
    }, [user, initialized, forceShow, segments]);

    // Show loading screen while initializing (max 3 seconds)
    if (!initialized && !forceShow) {
        return (
            <SafeAreaView style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <>
            <StatusBar style="dark" />
            <Slot />
        </>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <RootLayoutNav />
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 16,
        color: colors.textSecondary,
        fontSize: 16,
    },
});
