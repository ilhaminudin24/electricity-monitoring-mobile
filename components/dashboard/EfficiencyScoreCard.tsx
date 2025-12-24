import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

    // SVG Ring Progress calculations
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = hasData ? (totalScore / 100) * circumference : 0;
    const offset = circumference - progress;

    // Get score status
    const getScoreStatus = (pts: number, maxPts: number) => {
        const ratio = pts / maxPts;
        if (ratio >= 0.7) return { icon: '✓', color: colors.success, bg: `${colors.success}20` };
        if (ratio >= 0.5) return { icon: '!', color: colors.topup, bg: `${colors.topup}20` };
        return { icon: '✗', color: colors.error, bg: `${colors.error}20` };
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
            <View style={styles.card}>
                <View style={styles.header}>
                    <Target size={20} color={colors.reading} />
                    <Text style={styles.title}>Skor Efisiensi</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </View>
            </View>
        );
    }

    if (!hasData) {
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Target size={20} color={colors.reading} />
                    <Text style={styles.title}>Skor Efisiensi</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Target size={40} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                    <Text style={styles.emptyText}>
                        {message || 'Butuh minimal 7 hari data'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <Target size={20} color={colors.reading} />
                <Text style={styles.title}>Skor Efisiensi</Text>
            </View>

            {/* Score Ring + Grade */}
            <View style={styles.scoreRow}>
                {/* SVG Ring */}
                <View style={styles.ringContainer}>
                    <View style={styles.ringBackground}>
                        <Text style={[styles.scoreValue, { color: gradeColors.text }]}>{totalScore}</Text>
                        <Text style={styles.scoreMax}>/100</Text>
                    </View>
                </View>

                {/* Grade & Message */}
                <View style={styles.gradeContainer}>
                    <View style={[styles.gradeBadge, { backgroundColor: gradeColors.bg }]}>
                        <Text style={[styles.gradeText, { color: gradeColors.text }]}>Grade {grade}</Text>
                    </View>
                    <Text style={styles.gradeMessage}>{getGradeMessage(grade)}</Text>
                </View>
            </View>

            {/* Breakdown Cards */}
            <View style={styles.breakdownRow}>
                {/* Consistency */}
                <View style={[styles.breakdownCard, { backgroundColor: getScoreStatus(consistencyScore, 30).bg }]}>
                    <View style={styles.breakdownHeader}>
                        <Activity size={14} color={colors.textSecondary} />
                        <Text style={styles.breakdownLabel}>Konsistensi</Text>
                    </View>
                    <View style={styles.breakdownValue}>
                        <Text style={styles.breakdownScore}>{consistencyScore}</Text>
                        <Text style={styles.breakdownMax}>/30</Text>
                    </View>
                </View>

                {/* Budget */}
                <View style={[styles.breakdownCard, { backgroundColor: getScoreStatus(budgetScore, 40).bg }]}>
                    <View style={styles.breakdownHeader}>
                        <Wallet size={14} color={colors.textSecondary} />
                        <Text style={styles.breakdownLabel}>Budget</Text>
                    </View>
                    <View style={styles.breakdownValue}>
                        <Text style={styles.breakdownScore}>{budgetScore}</Text>
                        <Text style={styles.breakdownMax}>/40</Text>
                    </View>
                </View>

                {/* Trend */}
                <View style={[styles.breakdownCard, { backgroundColor: getScoreStatus(trendScore, 30).bg }]}>
                    <View style={styles.breakdownHeader}>
                        {(breakdown?.trend?.changePct ?? 0) < 0 ? (
                            <TrendingDown size={14} color={colors.success} />
                        ) : (breakdown?.trend?.changePct ?? 0) > 0 ? (
                            <TrendingUp size={14} color={colors.error} />
                        ) : (
                            <Minus size={14} color={colors.textSecondary} />
                        )}
                        <Text style={styles.breakdownLabel}>Tren</Text>
                    </View>
                    <View style={styles.breakdownValue}>
                        <Text style={styles.breakdownScore}>{trendScore}</Text>
                        <Text style={styles.breakdownMax}>/30</Text>
                    </View>
                </View>
            </View>

            {/* Tips */}
            {tips.length > 0 && (
                <View style={styles.tipsContainer}>
                    {tips.slice(0, 2).map((tipType, idx) => {
                        const tipData = getTipData(tipType);
                        if (!tipData) return null;
                        return (
                            <View key={idx} style={styles.tipItem}>
                                <Lightbulb size={16} color={colors.topup} />
                                <View style={styles.tipContent}>
                                    <Text style={styles.tipTitle}>{tipData.title}</Text>
                                    <Text style={styles.tipMessage}>{tipData.message}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* All Good */}
            {tips.length === 0 && hasData && (
                <View style={styles.allGoodContainer}>
                    <Text style={styles.allGoodEmoji}>🎉</Text>
                    <View>
                        <Text style={styles.allGoodTitle}>Semuanya baik!</Text>
                        <Text style={styles.allGoodMessage}>Pertahankan pola pemakaian Anda.</Text>
                    </View>
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
    loadingContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        paddingVertical: 24,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    ringContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scoreMax: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    gradeContainer: {
        flex: 1,
    },
    gradeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    gradeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    gradeMessage: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    breakdownRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    breakdownCard: {
        flex: 1,
        padding: 10,
        borderRadius: 12,
    },
    breakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    breakdownLabel: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    breakdownValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    breakdownScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    breakdownMax: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    tipsContainer: {
        gap: 8,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 12,
        backgroundColor: `${colors.topup}10`,
        borderRadius: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.topup,
    },
    tipMessage: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    allGoodContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: `${colors.success}10`,
        borderRadius: 12,
    },
    allGoodEmoji: {
        fontSize: 24,
    },
    allGoodTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.success,
    },
    allGoodMessage: {
        fontSize: 11,
        color: colors.textSecondary,
    },
});
