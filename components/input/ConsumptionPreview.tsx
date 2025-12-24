import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowDown, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { formatRupiah, formatKwh } from '@/shared/utils/rupiah';
import { GlassCard } from '@/components/ui/GlassCard';

interface ConsumptionPreviewProps {
    previousReading: number | null;
    currentReading: number;
    tariffPerKwh: number;
}

export function ConsumptionPreview({
    previousReading,
    currentReading,
    tariffPerKwh,
}: ConsumptionPreviewProps) {
    if (previousReading === null) {
        return null;
    }

    const consumption = previousReading - currentReading;
    const estimatedCost = consumption * tariffPerKwh;
    const isValid = consumption >= 0;

    if (!isValid) {
        return (
            <GlassCard style={styles.errorContainer}>
                <View style={styles.row}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>
                        Pembacaan meter baru ({formatKwh(currentReading, 1)}) lebih tinggi dari pembacaan terakhir ({formatKwh(previousReading, 1)}).
                        {'\n'}Gunakan mode "Top Up Token" jika Anda membeli token listrik.
                    </Text>
                </View>
            </GlassCard>
        );
    }

    return (
        <GlassCard variant="reading" style={styles.container}>
            <View style={styles.header}>
                <TrendingDown size={20} color={colors.reading} />
                <Text style={styles.title}>Pratinjau Konsumsi</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.readingRow}>
                    <View style={styles.readingItem}>
                        <Text style={styles.readingLabel}>Meter Sebelumnya</Text>
                        <Text style={styles.readingValue}>{formatKwh(previousReading, 1)}</Text>
                    </View>

                    <ArrowDown size={24} color={colors.textSecondary} />

                    <View style={styles.readingItem}>
                        <Text style={styles.readingLabel}>Meter Sekarang</Text>
                        <Text style={styles.readingValue}>{formatKwh(currentReading, 1)}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Konsumsi</Text>
                        <Text style={[styles.resultValue, { color: colors.reading }]}>
                            {formatKwh(consumption, 2)}
                        </Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Est. Biaya</Text>
                        <Text style={[styles.resultValue, { color: colors.secondary[600] }]}>
                            {formatRupiah(estimatedCost)}
                        </Text>
                    </View>
                </View>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    errorContainer: {
        marginTop: 16,
        backgroundColor: '#FEF2F2',
        borderColor: colors.error,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    content: {},
    readingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    readingItem: {
        flex: 1,
        alignItems: 'center',
    },
    readingLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    readingValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 16,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    resultItem: {
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    errorIcon: {
        fontSize: 20,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: colors.error,
        lineHeight: 20,
    },
});
