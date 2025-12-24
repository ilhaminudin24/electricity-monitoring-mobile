import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { ChartDataPoint } from '@/shared/utils/analytics';

interface TotalUsageCardProps {
    totalKwh: number;
    trendPercentage: number;
    data: ChartDataPoint[];
    filter: 'day' | 'week' | 'month';
    loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 72;

export function TotalUsageCard({ totalKwh, trendPercentage, data, filter, loading }: TotalUsageCardProps) {
    const isPositive = trendPercentage >= 0;

    const getRangeTitle = () => {
        switch (filter) {
            case 'day': return '7 Hari Terakhir';
            case 'week': return '4 Minggu Terakhir';
            case 'month': return '6 Bulan Terakhir';
            default: return 'Total Penggunaan';
        }
    };

    const chartConfig = {
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 1,
        color: (opacity = 1) => colors.reading,
        labelColor: (opacity = 1) => colors.textSecondary,
        barPercentage: 0.7,
        propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: '4,4',
        },
        fillShadowGradient: colors.reading,
        fillShadowGradientOpacity: 1,
    };

    // Prepare styles for bar colors manually since chart-kit doesn't support individual bar colors well in all versions
    // But we can try to use the color function if we pass data correctly.
    // For simplicity and stability with chart-kit, we'll use a single color but we can try to customize if needed.
    // The reference uses green for last bar, blue for topup. 
    // react-native-chart-kit basic BarChart doesn't support individual bar colors easily without hacks.
    // We will stick to a clean single color for now, or use `withCustomBarColorFromData` if we have the specific fork.
    // Assuming standard library, stick to single color.

    const chartData = {
        labels: data.map(d => String(d.x)),
        datasets: [
            {
                data: data.map(d => d.y),
            }
        ],
    };

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Total Penggunaan</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerLabel}>TOTAL PENGGUNAAN</Text>
                        <View style={styles.valueRow}>
                            <Text style={styles.totalValue}>{totalKwh !== undefined ? totalKwh.toFixed(1) : '-'}</Text>
                            <Text style={styles.unit}>kWh</Text>
                        </View>
                    </View>

                    {/* Trend Badge */}
                    <View style={[
                        styles.trendBadge,
                        { backgroundColor: isPositive ? `${colors.success}15` : `${colors.error}15` }
                    ]}>
                        {isPositive ? (
                            <TrendingUp size={12} color={colors.success} />
                        ) : (
                            <TrendingDown size={12} color={colors.error} />
                        )}
                        <Text style={[
                            styles.trendText,
                            { color: isPositive ? colors.success : colors.error }
                        ]}>
                            {Math.abs(trendPercentage)}%
                        </Text>
                    </View>
                </View>

                {/* Range Badge */}
                <View style={styles.rangeBadge}>
                    <Text style={styles.rangeText}>{getRangeTitle()}</Text>
                </View>
            </View>

            {/* Chart */}
            {data && data.length > 0 ? (
                <View style={styles.chartContainer}>
                    <BarChart
                        data={chartData}
                        width={chartWidth}
                        height={180}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={chartConfig}
                        style={styles.chart}
                        fromZero
                        showValuesOnTopOfBars={filter === 'day'}
                        withInnerLines={true}
                    />
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada data</Text>
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
        marginBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    unit: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    rangeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    rangeText: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    chartContainer: {
        alignItems: 'center',
    },
    chart: {
        borderRadius: 8,
        paddingRight: 0,
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
