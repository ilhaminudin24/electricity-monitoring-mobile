import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { clearAllData } from '@/lib/storage';
import type { User, AuthState } from '@/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<{ url: string | null; error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(supabaseUser: SupabaseUser): User {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name,
        avatar_url: supabaseUser.user_metadata?.avatar_url,
    };
}

async function ensureUserProfile(user: SupabaseUser): Promise<void> {
    try {
        const { data } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!data) {
            await supabase.from('user_profiles').insert({
                id: user.id,
                display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
                role: 'user',
                status: 'active',
            });
        } else {
            await supabase
                .from('user_profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);
        }
    } catch (error) {
        console.warn('Failed to ensure user profile:', error);
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: false, // Start with false, not loading
        initialized: false,
    });

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                console.log('Initializing auth...');

                // Add timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Auth timeout')), 5000);
                });

                const sessionPromise = supabase.auth.getSession();

                const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (mounted) {
                    console.log('Session loaded:', !!data?.session);
                    setState({
                        session: data?.session || null,
                        user: data?.session?.user ? mapUser(data.session.user) : null,
                        loading: false,
                        initialized: true,
                    });
                }
            } catch (error) {
                console.warn('Auth initialization error:', error);
                // Still mark as initialized even on error
                if (mounted) {
                    setState({
                        session: null,
                        user: null,
                        loading: false,
                        initialized: true,
                    });
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event);

                if (mounted) {
                    setState(prev => ({
                        ...prev,
                        session,
                        user: session?.user ? mapUser(session.user) : null,
                        loading: false,
                        initialized: true,
                    }));

                    if (event === 'SIGNED_IN' && session?.user) {
                        await ensureUserProfile(session.user);
                    }

                    if (event === 'SIGNED_OUT') {
                        await clearAllData();
                    }
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setState(prev => ({ ...prev, loading: false }));
        return { error: error as Error | null };
    }, []);

    const signUp = useCallback(async (email: string, password: string, name: string) => {
        setState(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: name },
            },
        });
        setState(prev => ({ ...prev, loading: false }));
        return { error: error as Error | null };
    }, []);

    const signOut = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        await supabase.auth.signOut();
        setState(prev => ({ ...prev, loading: false, user: null, session: null }));
    }, []);

    const signInWithGoogle = useCallback(async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'catattoken://auth/callback',
                skipBrowserRedirect: true,
            },
        });
        return {
            url: data?.url || null,
            error: error as Error | null
        };
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'catattoken://auth/reset-password',
        });
        return { error: error as Error | null };
    }, []);

    const updatePassword = useCallback(async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: error as Error | null };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signIn,
                signUp,
                signOut,
                signInWithGoogle,
                resetPassword,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
