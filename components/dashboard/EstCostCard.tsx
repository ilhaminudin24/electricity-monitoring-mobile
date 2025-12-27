import React from 'react';
import { View, Text } from 'react-native';
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
        <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-semibold text-slate-800">
                    Estimasi Biaya
                </Text>
                <Text
                    className="text-xs font-medium"
                    style={{ color: getProgressColor() }}
                >
                    {getStatusText()}
                </Text>
            </View>

            {loading ? (
                <View className="h-20 justify-center items-center">
                    <Text className="text-slate-500">Memuat...</Text>
                </View>
            ) : (
                <>
                    <Text className="text-[28px] font-bold text-slate-800">
                        {formatRupiah(estimatedCost)}
                    </Text>
                    <Text className="text-sm text-slate-500 mt-0.5 mb-3">
                        dari {formatRupiah(budgetMonthly)}
                    </Text>

                    <View className="flex-row items-center gap-3">
                        <View className="flex-1 h-2 bg-border rounded overflow-hidden relative">
                            <View
                                className="h-full rounded"
                                style={{
                                    width: `${Math.min(percentage, 100)}%`,
                                    backgroundColor: getProgressColor(),
                                }}
                            />
                            {/* Alert threshold indicator */}
                            <View
                                className="absolute -top-0.5 w-0.5 h-3 bg-topup"
                                style={{ left: `${alertThreshold}%` }}
                            />
                        </View>
                        <Text className="text-sm font-semibold text-slate-500 min-w-[40px] text-right">
                            {percentage.toFixed(0)}%
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
}
