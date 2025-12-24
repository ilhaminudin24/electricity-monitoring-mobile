import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { colors } from '@/constants/colors';

export default function ForgotPasswordScreen() {
    const router = useRouter();

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>← Kembali</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Lupa Password?</Text>
                    <Text style={styles.subtitle}>
                        Masukkan email Anda dan kami akan mengirim link untuk reset password.
                    </Text>
                </View>

                <PasswordResetForm />

                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity style={styles.loginLink}>
                        <Text style={styles.loginText}>Kembali ke Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
    },
    backText: {
        color: colors.primary[400],
        fontSize: 16,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 8,
        lineHeight: 22,
    },
    loginLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    loginText: {
        color: colors.primary[400],
        fontSize: 14,
    },
});
