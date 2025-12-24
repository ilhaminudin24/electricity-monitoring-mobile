import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { formatRupiah } from '@/shared/utils/rupiah';

interface EstCostCardProps {
    estimatedCost: number;
    budgetMonthly: number;
    alertThreshold: number; // percentage (e.g., 80)
    loading?: boolean;
}

export function EstCostCard({ estimatedCost, budgetMonthly, alertThreshold, loading }: EstCostCardProps) {
    const percentage = budgetMonthly > 0 ? (estimatedCost / budgetMonthly) * 100 : 0;
    const isWarning = percentage >= alertThreshold;
    const isOverBudget = percentage >= 100;

    const getProgressColor = () => {
        if (isOverBudget) return colors.error;
        if (isWarning) return colors.topup;
        return colors.success;
    };

    const getStatusText = () => {
        if (isOverBudget) return 'Melebihi Budget!';
        if (isWarning) return 'Mendekati Batas';
        return 'Dalam Budget';
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Estimasi Biaya</Text>
                <Text style={[styles.status, { color: getProgressColor() }]}>
                    {getStatusText()}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.costValue}>{formatRupiah(estimatedCost)}</Text>
                    <Text style={styles.budgetText}>
                        dari {formatRupiah(budgetMonthly)}
                    </Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBackground}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(percentage, 100)}%`,
                                        backgroundColor: getProgressColor(),
                                    },
                                ]}
                            />
                            {/* Alert threshold indicator */}
                            <View
                                style={[
                                    styles.thresholdIndicator,
                                    { left: `${alertThreshold}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
                    </View>
                </>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    status: {
        fontSize: 12,
        fontWeight: '500',
    },
    costValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    budgetText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
        marginBottom: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBackground: {
        flex: 1,
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    thresholdIndicator: {
        position: 'absolute',
        top: -2,
        width: 2,
        height: 12,
        backgroundColor: colors.topup,
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        minWidth: 40,
        textAlign: 'right',
    },
    loadingContainer: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
    },
});
