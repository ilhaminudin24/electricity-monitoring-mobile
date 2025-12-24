import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { colors } from '@/constants/colors';
import { BurnRateProjection } from '@/shared/utils/analytics';

interface TokenBurnRateChartProps {
    burnRateData: BurnRateProjection | null;
    loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 72;

export function TokenBurnRateChart({ burnRateData, loading }: TokenBurnRateChartProps) {
    const hasData = burnRateData?.hasData ?? false;
    const projectionData = burnRateData?.projectionData || [];
    const remainingKwh = burnRateData?.remainingKwh || 0;
    const daysRemaining = burnRateData?.daysUntilDepletion;
    const depletionDate = burnRateData?.predictedDepletionDate;
    const avgDailyUsage = burnRateData?.avgDailyUsage || 0;
    const isCritical = burnRateData?.isCritical || false;
    const isWarning = burnRateData?.isWarning || false;

    // Status info
    const getStatusInfo = () => {
        if (isCritical) {
            return {
                color: colors.error,
                bgColor: `${colors.error}15`,
                label: 'Kritis',
            };
        }
        if (isWarning) {
            return {
                color: colors.topup,
                bgColor: `${colors.topup}15`,
                label: 'Peringatan',
            };
        }
        return {
            color: colors.success,
            bgColor: `${colors.success}15`,
            label: 'Aman',
        };
    };

    const status = getStatusInfo();

    // Format depletion date
    const formatDepletionDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), 'd MMM', { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Proyeksi Token</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </View>
            </View>
        );
    }

    if (!hasData || projectionData.length === 0) {
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Proyeksi Token</Text>
                    <Text style={styles.subtitle}>Berdasarkan rata-rata 30 hari</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada data token</Text>
                    <Text style={styles.emptySubtext}>Tambahkan top-up untuk melihat proyeksi</Text>
                </View>
            </View>
        );
    }

    // Prepare chart data - take up to 15 points for readability
    const chartPoints = projectionData.filter((_, i) =>
        i === 0 || // Always include first
        i === projectionData.length - 1 || // Always include last
        i % Math.ceil(projectionData.length / 15) === 0 // Sample evenly
    ).slice(0, 15);

    const chartData = {
        labels: chartPoints.map((d, i) => {
            if (i === 0) return 'Hari Ini';
            if (i === chartPoints.length - 1) return formatDepletionDate(d.date);
            return '';
        }),
        datasets: [
            {
                data: chartPoints.map(d => d.kwhRemaining),
                color: () => status.color,
                strokeWidth: 2,
            },
        ],
    };

    const chartConfig = {
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 0,
        color: () => status.color,
        labelColor: () => colors.textSecondary,
        propsForDots: {
            r: '3',
            strokeWidth: '1',
            stroke: status.color,
        },
        propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: '4,4',
        },
        fillShadowGradient: status.color,
        fillShadowGradientOpacity: 0.2,
    };

    return (
        <View style={styles.card}>
            {/* Header with Status */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.title}>Proyeksi Token</Text>
                    <Text style={styles.subtitle}>Berdasarkan rata-rata 30 hari</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{remainingKwh.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>kWh tersisa</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: status.color }]}>
                        {daysRemaining !== null ? daysRemaining : '-'}
                    </Text>
                    <Text style={styles.statLabel}>hari lagi</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatDepletionDate(depletionDate ?? null)}</Text>
                    <Text style={styles.statLabel}>perkiraan habis</Text>
                </View>
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={160}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                    bezier
                    withDots={true}
                    withShadow={true}
                    fromZero
                />
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Rata-rata: <Text style={styles.footerBold}>{avgDailyUsage.toFixed(2)} kWh/hari</Text>
            </Text>
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
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
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
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        backgroundColor: colors.background,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 2,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    chart: {
        borderRadius: 8,
    },
    footer: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    footerBold: {
        fontWeight: '600',
        color: colors.text,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    emptySubtext: {
        fontSize: 12,
        color: colors.textSecondary,
        opacity: 0.7,
    },
});
