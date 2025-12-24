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

export function LoginForm() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        // Clean inputs (remove any hidden characters from Android keyboard)
        const cleanEmail = email.trim().toLowerCase().replace(/\s/g, '');
        const cleanPassword = password; // Don't trim password, but log length

        console.log('Login attempt:', {
            email: cleanEmail,
            passwordLength: cleanPassword.length
        });

        // Validation
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
            // Translate common error messages
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
        <View style={styles.container}>
            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.error}>{error}</Text>
                </View>
            ) : null}

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
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Masuk</Text>
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
        backgroundColor: colors.primary[600],
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
