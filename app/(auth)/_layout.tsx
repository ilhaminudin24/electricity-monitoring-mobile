import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function AuthLayout() {
    useEffect(() => {
        // Handle deep link callback for OAuth
        const handleDeepLink = async (event: { url: string }) => {
            try {
                const url = new URL(event.url);

                // Check for tokens in URL (hash fragment or query params)
                const accessToken = url.searchParams.get('access_token') ||
                    url.hash?.match(/access_token=([^&]*)/)?.[1];
                const refreshToken = url.searchParams.get('refresh_token') ||
                    url.hash?.match(/refresh_token=([^&]*)/)?.[1];

                if (accessToken && refreshToken) {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                }
            } catch (error) {
                console.error('Error handling deep link:', error);
            }
        };

        // Listen for incoming links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened via deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => subscription.remove();
    }, []);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
        </Stack>
    );
}
