import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';

export function LoginForm() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const cleanEmail = email.trim().toLowerCase().replace(/\s/g, '');
        const cleanPassword = password;

        console.log('Login attempt:', {
            email: cleanEmail,
            passwordLength: cleanPassword.length
        });

        if (!cleanEmail) {
            setError('Email harus diisi');
            return;
        }
        if (!cleanPassword) {
            setError('Password harus diisi');
            return;
        }

        setLoading(true);
        setError('');

        const { error: authError } = await signIn(cleanEmail, cleanPassword);

        if (authError) {
            const message = authError.message;
            if (message.includes('Invalid login credentials')) {
                setError('Email atau password salah');
            } else if (message.includes('Email not confirmed')) {
                setError('Email belum dikonfirmasi. Cek inbox email Anda.');
            } else {
                setError(message);
            }
        }

        setLoading(false);
    };

    return (
        <View className="gap-4">
            {error ? (
                <View className="bg-error/10 rounded-lg p-3 border border-error">
                    <Text className="text-error text-center text-sm">{error}</Text>
                </View>
            ) : null}

            <View className="gap-1.5">
                <Text className="text-slate-500 text-sm font-medium">Email</Text>
                <TextInput
                    className="bg-surface rounded-xl p-4 text-slate-800 text-base border border-border"
                    placeholder="nama@email.com"
                    placeholderTextColor={colors.slate[500]}
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                />
            </View>

            <View className="gap-1.5">
                <Text className="text-slate-500 text-sm font-medium">Password</Text>
                <TextInput
                    className="bg-surface rounded-xl p-4 text-slate-800 text-base border border-border"
                    placeholder="••••••••"
                    placeholderTextColor={colors.slate[500]}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setError('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                />
            </View>

            <TouchableOpacity
                className={`bg-primary-600 rounded-xl p-4 items-center mt-2 ${loading ? 'opacity-70' : ''}`}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-base font-semibold">Masuk</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
