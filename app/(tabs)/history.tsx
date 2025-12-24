import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

export default function HistoryScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Riwayat</Text>
                <Text style={styles.subtitle}>Lihat riwayat pembacaan meter</Text>
            </View>

            <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📋</Text>
                <Text style={styles.placeholderText}>
                    History list akan diimplementasi di Phase 4
                </Text>
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
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
