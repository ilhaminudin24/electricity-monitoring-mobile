import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Circle } from '@shopify/react-native-skia';
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
const CHART_HEIGHT = 150;
const CHART_WIDTH = screenWidth - 72;

export function TotalUsageCard({ totalKwh, trendPercentage, data, filter, loading }: TotalUsageCardProps) {
    const isPositive = trendPercentage >= 0;
    const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

    const getRangeTitle = () => {
        switch (filter) {
            case 'day': return '7 Hari Terakhir';
            case 'week': return '4 Minggu Terakhir';
            case 'month': return '6 Bulan Terakhir';
            default: return 'Total Penggunaan';
        }
    };

    // Prepare chart data for Victory Native
    const chartData = data.map((d, index) => ({
        x: index,
        y: typeof d.y === 'number' && !isNaN(d.y) ? Math.max(d.y, 0.1) : 0.1,
        label: String(d.x),
        originalY: d.y,
    }));

    const barWidth = Math.max(16, Math.floor((CHART_WIDTH - 80) / Math.max(chartData.length, 1)));

    // Get active tooltip data when user taps on chart
    const activeData = isActive && state.x.value !== undefined
        ? chartData[Math.round(state.x.value.value)]
        : null;

    if (loading) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="mb-4">
                    <Text className="text-base font-semibold text-slate-800">
                        Total Penggunaan
                    </Text>
                </View>
                <View className="h-[180px] justify-center items-center">
                    <Text className="text-slate-500">Memuat...</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
            {/* Header */}
            <View className="mb-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            TOTAL PENGGUNAAN
                        </Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text className="text-[28px] font-bold text-slate-800">
                                {totalKwh !== undefined ? totalKwh.toFixed(1) : '-'}
                            </Text>
                            <Text className="text-sm font-medium text-slate-500">kWh</Text>
                        </View>
                    </View>

                    {/* Trend Badge */}
                    <View
                        className="flex-row items-center gap-1 px-2 py-1 rounded-xl"
                        style={{ backgroundColor: isPositive ? `${colors.success}15` : `${colors.error}15` }}
                    >
                        {isPositive ? (
                            <TrendingUp size={12} color={colors.success} />
                        ) : (
                            <TrendingDown size={12} color={colors.error} />
                        )}
                        <Text
                            className="text-xs font-bold"
                            style={{ color: isPositive ? colors.success : colors.error }}
                        >
                            {Math.abs(trendPercentage)}%
                        </Text>
                    </View>
                </View>

                {/* Range Badge */}
                <View className="self-start bg-white px-2 py-1 rounded-lg">
                    <Text className="text-[10px] text-slate-500">{getRangeTitle()}</Text>
                </View>
            </View>

            {/* Tooltip - shown when user taps on chart */}
            {activeData && isActive && (
                <View className="bg-white rounded-lg p-2 mb-2 shadow-sm border border-slate-100">
                    <Text className="text-sm font-semibold text-slate-800">{activeData.label}</Text>
                    <Text className="text-lg font-bold" style={{ color: colors.reading }}>
                        {activeData.originalY?.toFixed(2) || '0.00'} kWh
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                        Konsumsi didistribusikan merata per hari
                    </Text>
                </View>
            )}

            {/* Chart */}
            {data && data.length > 0 && chartData.length > 0 ? (
                <View>
                    {/* Chart Area */}
                    <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
                        <CartesianChart
                            data={chartData}
                            xKey="x"
                            yKeys={["y"]}
                            domainPadding={{ left: 20, right: 20, top: 10, bottom: 0 }}
                            chartPressState={state}
                        >
                            {({ points, chartBounds }) => (
                                <>
                                    <Bar
                                        points={points.y}
                                        chartBounds={chartBounds}
                                        color={colors.reading}
                                        barWidth={barWidth}
                                        roundedCorners={{ topLeft: 4, topRight: 4 }}
                                    />
                                    {/* Active indicator dot */}
                                    {isActive && state.y.y.position && (
                                        <Circle
                                            cx={state.x.position.value}
                                            cy={state.y.y.position.value}
                                            r={5}
                                            color={colors.primary[500]}
                                        />
                                    )}
                                </>
                            )}
                        </CartesianChart>
                    </View>

                    {/* Custom X-Axis Labels */}
                    <View className="flex-row justify-around mt-2 px-2">
                        {chartData.map((d, index) => (
                            <Text
                                key={index}
                                className="text-[8px] text-slate-500 text-center"
                                style={{ flex: 1 }}
                                numberOfLines={1}
                            >
                                {d.label}
                            </Text>
                        ))}
                    </View>
                </View>
            ) : (
                <View className="h-[120px] justify-center items-center">
                    <Text className="text-sm text-slate-500">Belum ada data</Text>
                </View>
            )}
        </View>
    );
}
