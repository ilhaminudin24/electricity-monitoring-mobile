import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
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
        // Validation
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
        <View style={styles.container}>
            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.error}>{error}</Text>
                </View>
            ) : null}

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                    style={styles.input}
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

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
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

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
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

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Konfirmasi Password</Text>
                <TextInput
                    style={styles.input}
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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Daftar</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    label: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    button: {
        backgroundColor: colors.secondary[600],
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.error,
    },
    error: {
        color: colors.error,
        textAlign: 'center',
        fontSize: 14,
    },
});
