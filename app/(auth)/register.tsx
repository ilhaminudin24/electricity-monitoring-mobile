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
import { RegisterForm } from '@/components/auth/RegisterForm';
import { colors } from '@/constants/colors';

export default function RegisterScreen() {
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
                    <Text style={styles.title}>Buat Akun Baru</Text>
                    <Text style={styles.subtitle}>Mulai catat penggunaan listrik Anda</Text>
                </View>

                <RegisterForm />

                <View style={styles.links}>
                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Sudah punya akun? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Masuk</Text>
                            </TouchableOpacity>
                        </Link>
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
    },
    links: {
        marginTop: 24,
        alignItems: 'center',
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    loginLink: {
        color: colors.primary[400],
        fontSize: 14,
        fontWeight: '600',
    },
});
