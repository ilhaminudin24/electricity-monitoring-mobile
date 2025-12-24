import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { colors } from '@/constants/colors';

export default function LoginScreen() {
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>⚡ CatatToken.ID</Text>
                    <Text style={styles.subtitle}>Catat Listrik Anda dengan Mudah</Text>
                </View>

                <View style={styles.formContainer}>
                    <LoginForm />

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>atau</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <GoogleSignInButton />

                    <View style={styles.links}>
                        <Link href="/(auth)/forgot-password" asChild>
                            <TouchableOpacity>
                                <Text style={styles.link}>Lupa Password?</Text>
                            </TouchableOpacity>
                        </Link>

                        <View style={styles.registerRow}>
                            <Text style={styles.registerText}>Belum punya akun? </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.registerLink}>Daftar</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary[500],
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 8,
    },
    formContainer: {
        gap: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        color: colors.textSecondary,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    links: {
        marginTop: 24,
        alignItems: 'center',
        gap: 16,
    },
    link: {
        color: colors.primary[400],
        fontSize: 14,
    },
    registerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registerText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    registerLink: {
        color: colors.primary[400],
        fontSize: 14,
        fontWeight: '600',
    },
});
