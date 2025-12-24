import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

export default function AuthCallback() {
    const router = useRouter();
    const params = useLocalSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('Auth callback received, params:', params);

                // For web, tokens might be in hash fragment - we need to parse them
                if (typeof window !== 'undefined') {
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token') || params.access_token as string;
                    const refreshToken = hashParams.get('refresh_token') || params.refresh_token as string;

                    console.log('Tokens found:', {
                        hasAccess: !!accessToken,
                        hasRefresh: !!refreshToken
                    });

                    if (accessToken && refreshToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (error) {
                            console.error('Error setting session:', error);
                        } else {
                            console.log('Session set successfully');
                            // Redirect to main app
                            router.replace('/(tabs)');
                            return;
                        }
                    }
                }

                // If no tokens or error, redirect to login
                router.replace('/(auth)/login');
            } catch (error) {
                console.error('Callback error:', error);
                router.replace('/(auth)/login');
            }
        };

        handleCallback();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.text}>Logging in...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    text: {
        marginTop: 16,
        color: colors.textSecondary,
        fontSize: 16,
    },
});
