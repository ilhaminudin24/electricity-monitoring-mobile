import { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import * as Linking from 'expo-linking';

// Ensure WebBrowser sessions are handled properly
WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInButton() {
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);

        try {
            const redirectUrl = Linking.createURL('auth/callback');
            console.log('Google OAuth redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                console.log('Opening auth URL...');

                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                console.log('Auth session result:', result.type);

                if (result.type === 'success' && result.url) {
                    console.log('Callback URL received');

                    const url = new URL(result.url);
                    const hashParams = new URLSearchParams(url.hash?.substring(1) || '');
                    const accessToken = url.searchParams.get('access_token') || hashParams.get('access_token');
                    const refreshToken = url.searchParams.get('refresh_token') || hashParams.get('refresh_token');

                    console.log('Tokens found:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

                    if (accessToken && refreshToken) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) {
                            console.error('Session error:', sessionError);
                            throw sessionError;
                        }

                        console.log('Google login successful!');
                    } else {
                        const { data: sessionData } = await supabase.auth.getSession();
                        if (sessionData?.session) {
                            console.log('Session found from Supabase');
                        } else {
                            console.warn('No tokens found in callback URL');
                        }
                    }
                } else if (result.type === 'cancel') {
                    console.log('User cancelled login');
                } else if (result.type === 'dismiss') {
                    console.log('Browser dismissed');
                }
            }
        } catch (error: any) {
            console.error('Google login error:', error);
            if (Platform.OS === 'web') {
                alert(error.message || 'Gagal login dengan Google');
            } else {
                Alert.alert('Error', error.message || 'Gagal login dengan Google');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity
            className="bg-white rounded-xl p-4 flex-row items-center justify-center gap-2 border border-border"
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={colors.slate[800]} />
            ) : (
                <Text className="text-slate-800 text-base font-semibold">
                    🔵 Masuk dengan Google
                </Text>
            )}
        </TouchableOpacity>
    );
}
