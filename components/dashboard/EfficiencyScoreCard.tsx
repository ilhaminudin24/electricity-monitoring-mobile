import React from 'react';
import { View, Text } from 'react-native';
import { Target, TrendingUp, TrendingDown, Minus, Wallet, Activity, Lightbulb } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { EfficiencyScore } from '@/shared/utils/analytics';

interface EfficiencyScoreCardProps {
    score: EfficiencyScore | null;
    hasData: boolean;
    message?: string;
    loading?: boolean;
}

export function EfficiencyScoreCard({ score, hasData, message, loading }: EfficiencyScoreCardProps) {
    const totalScore = score?.totalScore || 0;
    const grade = score?.grade || '-';
    const consistencyScore = score?.consistencyScore || 0;
    const budgetScore = score?.budgetScore || 0;
    const trendScore = score?.trendScore || 0;
    const tips = score?.tips || [];
    const breakdown = score?.breakdown;

    // Get grade color
    const getGradeColor = (g: string) => {
        switch (g) {
            case 'A+':
            case 'A':
                return { text: colors.success, bg: `${colors.success}15` };
            case 'B':
                return { text: colors.reading, bg: `${colors.reading}15` };
            case 'C':
                return { text: colors.topup, bg: `${colors.topup}15` };
            case 'D':
            case 'F':
            default:
                return { text: colors.error, bg: `${colors.error}15` };
        }
    };

    const gradeColors = getGradeColor(grade);

    // Get score status
    const getScoreStatus = (pts: number, maxPts: number) => {
        const ratio = pts / maxPts;
        if (ratio >= 0.7) return { bg: `${colors.success}20` };
        if (ratio >= 0.5) return { bg: `${colors.topup}20` };
        return { bg: `${colors.error}20` };
    };

    // Get grade message
    const getGradeMessage = (g: string) => {
        switch (g) {
            case 'A+': return 'Luar biasa! Sangat efisien.';
            case 'A': return 'Bagus sekali! Pertahankan.';
            case 'B': return 'Baik. Masih bisa ditingkatkan.';
            case 'C': return 'Cukup. Perlu perhatian.';
            case 'D': return 'Kurang. Perlu perbaikan.';
            default: return 'Perlu perbaikan segera.';
        }
    };

    // Get tip data
    const getTipData = (tipType: string) => {
        switch (tipType) {
            case 'consistency':
                return {
                    title: 'Pemakaian Tidak Stabil',
                    message: 'Jadwalkan penggunaan AC/mesin cuci lebih merata.'
                };
            case 'budget':
                return {
                    title: 'Melebihi Budget',
                    message: 'Kurangi pemakaian atau naikkan budget di Settings.'
                };
            case 'trend':
                return {
                    title: 'Pemakaian Naik',
                    message: 'Periksa perangkat yang tidak efisien.'
                };
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="flex-row items-center gap-2 mb-4">
                    <Target size={20} color={colors.reading} />
                    <Text className="text-base font-semibold text-slate-800">Skor Efisiensi</Text>
                </View>
                <View className="h-[120px] justify-center items-center">
                    <Text className="text-slate-500">Memuat...</Text>
                </View>
            </View>
        );
    }

    if (!hasData) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="flex-row items-center gap-2 mb-4">
                    <Target size={20} color={colors.reading} />
                    <Text className="text-base font-semibold text-slate-800">Skor Efisiensi</Text>
                </View>
                <View className="py-6 items-center gap-3">
                    <Target size={40} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                    <Text className="text-sm text-slate-500 text-center">
                        {message || 'Butuh minimal 7 hari data'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
            {/* Header */}
            <View className="flex-row items-center gap-2 mb-4">
                <Target size={20} color={colors.reading} />
                <Text className="text-base font-semibold text-slate-800">Skor Efisiensi</Text>
            </View>

            {/* Score Ring + Grade */}
            <View className="flex-row items-center gap-4 mb-4">
                {/* Ring */}
                <View className="w-20 h-20 justify-center items-center">
                    <View className="w-20 h-20 rounded-full border-[6px] border-border justify-center items-center">
                        <Text
                            className="text-2xl font-bold"
                            style={{ color: gradeColors.text }}
                        >
                            {totalScore}
                        </Text>
                        <Text className="text-[10px] text-slate-500">/100</Text>
                    </View>
                </View>

                {/* Grade & Message */}
                <View className="flex-1">
                    <View
                        className="self-start px-3 py-1 rounded-xl mb-1"
                        style={{ backgroundColor: gradeColors.bg }}
                    >
                        <Text
                            className="text-xs font-semibold"
                            style={{ color: gradeColors.text }}
                        >
                            Grade {grade}
                        </Text>
                    </View>
                    <Text className="text-[13px] text-slate-500">{getGradeMessage(grade)}</Text>
                </View>
            </View>

            {/* Breakdown Cards */}
            <View className="flex-row gap-2 mb-3">
                {/* Consistency */}
                <View
                    className="flex-1 p-2.5 rounded-xl"
                    style={{ backgroundColor: getScoreStatus(consistencyScore, 30).bg }}
                >
                    <View className="flex-row items-center gap-1 mb-1.5">
                        <Activity size={14} color={colors.textSecondary} />
                        <Text className="text-[10px] text-slate-500">Konsistensi</Text>
                    </View>
                    <View className="flex-row items-baseline">
                        <Text className="text-lg font-bold text-slate-800">{consistencyScore}</Text>
                        <Text className="text-[10px] text-slate-500">/30</Text>
                    </View>
                </View>

                {/* Budget */}
                <View
                    className="flex-1 p-2.5 rounded-xl"
                    style={{ backgroundColor: getScoreStatus(budgetScore, 40).bg }}
                >
                    <View className="flex-row items-center gap-1 mb-1.5">
                        <Wallet size={14} color={colors.textSecondary} />
                        <Text className="text-[10px] text-slate-500">Budget</Text>
                    </View>
                    <View className="flex-row items-baseline">
                        <Text className="text-lg font-bold text-slate-800">{budgetScore}</Text>
                        <Text className="text-[10px] text-slate-500">/40</Text>
                    </View>
                </View>

                {/* Trend */}
                <View
                    className="flex-1 p-2.5 rounded-xl"
                    style={{ backgroundColor: getScoreStatus(trendScore, 30).bg }}
                >
                    <View className="flex-row items-center gap-1 mb-1.5">
                        {(breakdown?.trend?.changePct ?? 0) < 0 ? (
                            <TrendingDown size={14} color={colors.success} />
                        ) : (breakdown?.trend?.changePct ?? 0) > 0 ? (
                            <TrendingUp size={14} color={colors.error} />
                        ) : (
                            <Minus size={14} color={colors.textSecondary} />
                        )}
                        <Text className="text-[10px] text-slate-500">Tren</Text>
                    </View>
                    <View className="flex-row items-baseline">
                        <Text className="text-lg font-bold text-slate-800">{trendScore}</Text>
                        <Text className="text-[10px] text-slate-500">/30</Text>
                    </View>
                </View>
            </View>

            {/* Tips */}
            {tips.length > 0 && (
                <View className="gap-2">
                    {tips.slice(0, 2).map((tipType, idx) => {
                        const tipData = getTipData(tipType);
                        if (!tipData) return null;
                        return (
                            <View
                                key={idx}
                                className="flex-row items-start gap-2.5 p-3 rounded-xl"
                                style={{ backgroundColor: `${colors.topup}10` }}
                            >
                                <Lightbulb size={16} color={colors.topup} />
                                <View className="flex-1">
                                    <Text className="text-[13px] font-semibold text-topup">
                                        {tipData.title}
                                    </Text>
                                    <Text className="text-[11px] text-slate-500 mt-0.5">
                                        {tipData.message}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* All Good */}
            {tips.length === 0 && hasData && (
                <View
                    className="flex-row items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: `${colors.success}10` }}
                >
                    <Text className="text-2xl">🎉</Text>
                    <View>
                        <Text className="text-[13px] font-semibold text-success">Semuanya baik!</Text>
                        <Text className="text-[11px] text-slate-500">Pertahankan pola pemakaian Anda.</Text>
                    </View>
                </View>
            )}
        </View>
    );
}
