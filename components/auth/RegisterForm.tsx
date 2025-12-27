import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';

export function RegisterForm() {
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!name.trim()) {
            setError('Nama harus diisi');
            return;
        }
        if (!email.trim()) {
            setError('Email harus diisi');
            return;
        }
        if (!password) {
            setError('Password harus diisi');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }
        if (password !== confirmPassword) {
            setError('Password tidak sama');
            return;
        }

        setLoading(true);
        setError('');

        const { error: authError } = await signUp(email.trim(), password, name.trim());

        if (authError) {
            if (authError.message.includes('already registered')) {
                setError('Email sudah terdaftar');
            } else {
                setError(authError.message);
            }
            setLoading(false);
        } else {
            Alert.alert(
                'Registrasi Berhasil! 🎉',
                'Silakan cek email Anda untuk mengkonfirmasi akun.',
                [{ text: 'OK' }]
            );
            setLoading(false);
        }
    };

    return (
        <View className="gap-4">
            {error ? (
                <View className="bg-error/10 rounded-lg p-3 border border-error">
                    <Text className="text-error text-center text-sm">{error}</Text>
                </View>
            ) : null}

            <View className="gap-1.5">
                <Text className="text-slate-500 text-sm font-medium">Nama Lengkap</Text>
                <TextInput
                    className="bg-surface rounded-xl p-4 text-slate-800 text-base border border-border"
                    placeholder="John Doe"
                    placeholderTextColor={colors.slate[500]}
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        setError('');
                    }}
                    autoComplete="name"
                />
            </View>

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
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor={colors.slate[500]}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setError('');
                    }}
                    secureTextEntry
                    autoComplete="new-password"
                />
            </View>

            <View className="gap-1.5">
                <Text className="text-slate-500 text-sm font-medium">Konfirmasi Password</Text>
                <TextInput
                    className="bg-surface rounded-xl p-4 text-slate-800 text-base border border-border"
                    placeholder="Ulangi password"
                    placeholderTextColor={colors.slate[500]}
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError('');
                    }}
                    secureTextEntry
                    autoComplete="new-password"
                />
            </View>

            <TouchableOpacity
                className={`bg-secondary-600 rounded-xl p-4 items-center mt-2 ${loading ? 'opacity-70' : ''}`}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-base font-semibold">Daftar</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
