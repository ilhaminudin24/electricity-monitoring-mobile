import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Zap } from 'lucide-react-native';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { colors } from '@/constants/colors';
import { TokenPrediction } from '@/shared/utils/analytics';

interface TokenPredictionCardProps {
    prediction: TokenPrediction;
    loading?: boolean;
}

export function TokenPredictionCard({ prediction, loading }: TokenPredictionCardProps) {
    const isLowToken = prediction.daysRemaining <= 3 && prediction.daysRemaining > 0;
    const isEmpty = prediction.remainingKwh <= 0;

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return format(date, 'd MMMM yyyy', { locale: idLocale });
    };

    return (
        <View style={[styles.card, isLowToken && styles.cardWarning]}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    {isLowToken ? (
                        <AlertTriangle size={24} color={colors.topup} />
                    ) : (
                        <Zap size={24} color={colors.reading} />
                    )}
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Sisa Token</Text>
                    <Text style={styles.subtitle}>Prediksi berdasarkan penggunaan</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </View>
            ) : prediction.hasData ? (
                <View style={styles.content}>
                    <View style={styles.mainValue}>
                        <Text style={[styles.kwhValue, isLowToken && styles.kwhValueWarning]}>
                            {prediction.remainingKwh.toFixed(1)}
                        </Text>
                        <Text style={styles.kwhUnit}>kWh tersisa</Text>
                    </View>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailValue}>
                                {prediction.daysRemaining > 0 ? `~${prediction.daysRemaining}` : '0'}
                            </Text>
                            <Text style={styles.detailLabel}>hari lagi</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.detailItem}>
                            <Text style={styles.detailValue}>
                                {prediction.avgDailyUsage.toFixed(1)}
                            </Text>
                            <Text style={styles.detailLabel}>kWh/hari</Text>
                        </View>
                    </View>

                    {prediction.predictedDepletionDate && (
                        <View style={styles.predictionContainer}>
                            <Text style={styles.predictionLabel}>Perkiraan habis:</Text>
                            <Text style={[styles.predictionDate, isLowToken && styles.predictionDateWarning]}>
                                {formatDate(prediction.predictedDepletionDate)}
                            </Text>
                        </View>
                    )}

                    {isLowToken && (
                        <View style={styles.warningBanner}>
                            <AlertTriangle size={16} color={colors.topup} />
                            <Text style={styles.warningText}>
                                Token hampir habis! Segera isi ulang.
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Belum ada data. Mulai catat penggunaan untuk melihat prediksi.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardWarning: {
        borderColor: colors.topup,
        borderWidth: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    content: {},
    mainValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    kwhValue: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.reading,
    },
    kwhValueWarning: {
        color: colors.topup,
    },
    kwhUnit: {
        fontSize: 16,
        color: colors.textSecondary,
        marginLeft: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailValue: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border,
    },
    predictionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    predictionLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    predictionDate: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    predictionDateWarning: {
        color: colors.topup,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.topup}15`,
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: colors.topup,
        fontWeight: '500',
    },
    loadingContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
