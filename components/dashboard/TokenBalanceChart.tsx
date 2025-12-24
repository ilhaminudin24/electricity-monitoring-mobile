import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { colors } from '@/constants/colors';
import { DailyUsage } from '@/shared/utils/analytics';

interface TokenBalanceChartProps {
    dailyData: DailyUsage[];
    loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 72;

export function TokenBalanceChart({ dailyData, loading }: TokenBalanceChartProps) {
    // Always show last 30 days regardless of global filter
    const getChartData = () => {
        if (!dailyData || dailyData.length === 0) return [];
        // Filter for days that have a meter value (or interpolate if we had logic, 
        // but here we just take the points that exist or use daily entries)
        // dailyUsage always has entries for each day if computed correctly with range
        // We take up to last 30 days
        const last30 = dailyData.slice(-30);

        // Filter out null meterValues if any, though computeDailyUsage should handle it
        // We want to show the specific days
        return last30;
    };

    const data = getChartData();
    const hasData = data.length > 0 && data.some(d => d.meterValue !== null && d.meterValue !== undefined);

    // Prepare chart points
    // We only plot points where meterValue exists
    const validPoints = data.filter(d => d.meterValue !== null && d.meterValue !== undefined && d.meterValue > 0);

    // If too many points, sample them for labels but keep data for line?
    // Chart Kit needs equal length labels and data.
    // We'll use all valid points but limit labels to avoid clutter.

    // Actually, to make the chart look like a continuous history over 30 days, 
    // we should ideally use all 30 points.
    // If meterValue is missing for some days (e.g. gap), we might need to handle it.
    // But computeDailyUsage fills gaps with 'usage' but maybe not 'meterValue' if it's not a topup day?
    // Wait, computeDailyUsage sets meterValue = currKwh. So it should be the ENDING kwh of that day.
    // So every DailyUsage entry should have a meterValue if calculated correctly.

    const chartData = {
        labels: validPoints.map((d, i) => {
            // Show label for first, last, and every ~5th point
            if (i === 0 || i === validPoints.length - 1 || i % 6 === 0) {
                return format(new Date(d.date), 'd MMM', { locale: idLocale });
            }
            return '';
        }),
        datasets: [
            {
                data: validPoints.map(d => d.meterValue || 0),
                color: (opacity = 1) => colors.success,
                strokeWidth: 2,
            },
            {
                // Dummy dataset for dots coloring? 
                // ChartKit uses getDotColor callback.
                data: [],
                withDots: false
            }
        ],
        legend: ['Sisa Token (kWh)']
    };

    const chartConfig = {
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 1,
        color: (opacity = 1) => colors.success,
        labelColor: (opacity = 1) => colors.textSecondary,
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.success,
        },
        propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: '4,4',
        },
        fillShadowGradient: colors.success,
        fillShadowGradientOpacity: 0.2,
    };

    // Custom dot content to highlight top ups?
    // React Native Chart Kit limit: getDotColor is the main way.
    // We can highlight top-ups with a different dot color.

    const getDotColor = (dataPoint: number, index: number) => {
        const point = validPoints[index];
        if (point && point.isTopUp) {
            return colors.topup; // Blue for topup
        }
        return colors.success; // Green for normal
    };

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Riwayat Saldo Token</Text>
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
                    <Text style={styles.title}>Riwayat Saldo Token</Text>
                    <Text style={styles.subtitle}>30 Hari Terakhir</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada data saldo</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>Riwayat Saldo Token</Text>
                <Text style={styles.subtitle}>30 Hari Terakhir</Text>
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=" kWh"
                    chartConfig={chartConfig}
                    style={styles.chart}
                    bezier
                    withDots={true}
                    withShadow={true}
                    fromZero={false} // Allow auto-scale to see variations better
                    getDotColor={getDotColor}
                    onDataPointClick={({ value, dataset, getColor }) => {
                        // Optional: show tooltip
                    }}
                />
            </View>
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
    chartContainer: {
        alignItems: 'center',
    },
    chart: {
        borderRadius: 8,
        paddingRight: 16, // Add padding for rightmost labels
    },
    loadingContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
});

