import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        // Web doesn't support Alert.alert, use confirm instead
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Apakah Anda yakin ingin keluar?');
            if (confirmed) {
                await signOut();
            }
        } else {
            Alert.alert(
                'Logout',
                'Apakah Anda yakin ingin keluar?',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: signOut,
                    },
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pengaturan</Text>
                <Text style={styles.subtitle}>Kelola akun dan preferensi</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.display_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.display_name || 'User'}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>
            </View>

            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                    Settings lengkap akan diimplementasi di Phase 4
                </Text>
            </View>

            {/* Logout Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 4,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: 24,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
    },
    placeholderText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    footer: {
        padding: 24,
    },
    logoutButton: {
        backgroundColor: colors.error,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
