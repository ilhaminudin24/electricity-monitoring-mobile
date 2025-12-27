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

export function PasswordResetForm() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Email harus diisi');
            return;
        }

        setLoading(true);
        const { error } = await resetPassword(email.trim());

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setSent(true);
        }

        setLoading(false);
    };

    if (sent) {
        return (
            <View className="items-center p-6 bg-surface rounded-2xl">
                <Text className="text-5xl mb-4">✅</Text>
                <Text className="text-success text-xl font-semibold mb-2">Email Terkirim!</Text>
                <Text className="text-slate-500 text-sm text-center leading-5">
                    Silakan cek inbox atau folder spam email Anda untuk link reset password.
                </Text>
            </View>
        );
    }

    return (
        <View className="gap-4">
            <View className="gap-1.5">
                <Text className="text-slate-500 text-sm font-medium">Email</Text>
                <TextInput
                    className="bg-surface rounded-xl p-4 text-slate-800 text-base border border-border"
                    placeholder="nama@email.com"
                    placeholderTextColor={colors.slate[500]}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                />
            </View>

            <TouchableOpacity
                className={`bg-primary-600 rounded-xl p-4 items-center ${loading ? 'opacity-70' : ''}`}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-base font-semibold">Kirim Link Reset</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
