import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Line, Area, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { colors } from '@/constants/colors';
import { DailyUsage } from '@/shared/utils/analytics';

interface TokenBalanceChartProps {
    dailyData: DailyUsage[];
    loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const CHART_HEIGHT = 160;

export function TokenBalanceChart({ dailyData, loading }: TokenBalanceChartProps) {
    // Touch interaction state
    const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

    // Always show last 30 days regardless of global filter
    const getChartData = () => {
        if (!dailyData || dailyData.length === 0) return [];
        const last30 = dailyData.slice(-30);

        const validPoints = last30.filter(
            d => d.meterValue !== null && d.meterValue !== undefined && d.meterValue > 0
        );

        if (validPoints.length === 0) return [];

        // Sample evenly for readability (max 15 points)
        const chartPoints = validPoints.filter((_: unknown, i: number) =>
            i === 0 ||
            i === validPoints.length - 1 ||
            i % Math.ceil(validPoints.length / 15) === 0
        ).slice(0, 15);

        return chartPoints.map((d, index) => ({
            x: index,
            y: d.meterValue || 0,
            date: d.date,
            isTopUp: d.isTopUp || false,
            usage: d.usage || 0,
            topUpAmount: d.topUpAmount || 0,
        }));
    };

    const chartData = getChartData();
    const hasData = chartData.length > 0;

    // Get active tooltip data when user touches chart
    const activeData = isActive && state.x.value !== undefined
        ? chartData[Math.round(state.x.value.value)]
        : null;

    // Format date for display
    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    // Format short date
    const formatShortDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'd MMM', { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="mb-4">
                    <Text className="text-base font-semibold text-slate-800">
                        Riwayat Saldo Token
                    </Text>
                </View>
                <View className="h-[180px] justify-center items-center">
                    <Text className="text-slate-500">Memuat...</Text>
                </View>
            </View>
        );
    }

    if (!hasData) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="mb-4">
                    <Text className="text-base font-semibold text-slate-800">
                        Riwayat Saldo Token
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                        30 Hari Terakhir
                    </Text>
                </View>
                <View className="h-[120px] justify-center items-center">
                    <Text className="text-sm text-slate-500">Belum ada data saldo</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
            <View className="mb-4">
                <Text className="text-base font-semibold text-slate-800">
                    Riwayat Saldo Token
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                    30 Hari Terakhir
                </Text>
            </View>

            {/* Tooltip - shown when user touches chart */}
            {activeData && isActive && (
                <View className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-slate-100">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-slate-800">
                            📅 {formatDate(activeData.date)}
                        </Text>
                        {activeData.isTopUp && (
                            <View className="bg-topup/15 px-2 py-0.5 rounded">
                                <Text className="text-[10px] font-semibold text-topup">
                                    ⚡ Top Up
                                </Text>
                            </View>
                        )}
                    </View>
                    <View className="flex-row justify-between">
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-500">Saldo Token</Text>
                            <Text className="text-base font-bold text-success">
                                {activeData.y?.toFixed(1) || '0.0'} kWh
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-500">Konsumsi</Text>
                            <Text className="text-base font-bold text-reading">
                                {activeData.usage > 0 ? `-${activeData.usage.toFixed(2)}` : '0.00'} kWh
                            </Text>
                        </View>
                        {activeData.isTopUp && activeData.topUpAmount > 0 && (
                            <View className="flex-1">
                                <Text className="text-[10px] text-slate-500">Top Up</Text>
                                <Text className="text-base font-bold text-topup">
                                    +{activeData.topUpAmount.toFixed(1)} kWh
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Chart */}
            <View className="items-center my-2">
                <View style={{ height: CHART_HEIGHT, width: screenWidth - 72 }}>
                    <CartesianChart
                        data={chartData}
                        xKey="x"
                        yKeys={["y"]}
                        domainPadding={{ left: 10, right: 10, top: 20, bottom: 10 }}
                        chartPressState={state}
                    >
                        {({ points }) => (
                            <>
                                <Area
                                    points={points.y}
                                    y0={CHART_HEIGHT}
                                    color={colors.success}
                                    opacity={0.2}
                                    curveType="natural"
                                />
                                <Line
                                    points={points.y}
                                    color={colors.success}
                                    strokeWidth={2}
                                    curveType="natural"
                                />
                                {/* Active indicator dot */}
                                {isActive && state.y.y.position && (
                                    <Circle
                                        cx={state.x.position.value}
                                        cy={state.y.y.position.value}
                                        r={6}
                                        color={colors.primary[500]}
                                    />
                                )}
                                {/* Dots for top-up points and endpoints */}
                                {points.y.map((point: any, index: number) => {
                                    if (point.y === undefined || point.y === null) return null;
                                    const dataPoint = chartData[index];
                                    const isTopUp = dataPoint?.isTopUp;
                                    const isEndpoint = index === 0 || index === points.y.length - 1;

                                    if (!isTopUp && !isEndpoint) return null;

                                    return (
                                        <Circle
                                            key={index}
                                            cx={point.x}
                                            cy={point.y}
                                            r={isTopUp ? 5 : 4}
                                            color={isTopUp ? colors.topup : colors.success}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </CartesianChart>
                </View>

                {/* X-Axis Labels */}
                <View className="flex-row justify-between w-full px-2 mt-1">
                    <Text className="text-[10px] text-slate-400">
                        {chartData.length > 0 ? formatShortDate(chartData[0].date) : ''}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                        {chartData.length > 0 ? formatShortDate(chartData[chartData.length - 1].date) : ''}
                    </Text>
                </View>
            </View>

            {/* Legend with touch hint */}
            <View className="flex-row justify-center mt-2 gap-4">
                <View className="flex-row items-center gap-1">
                    <View className="w-3 h-3 rounded-full bg-success" />
                    <Text className="text-xs text-slate-500">Sisa Token</Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <View className="w-3 h-3 rounded-full bg-topup" />
                    <Text className="text-xs text-slate-500">Top Up</Text>
                </View>
            </View>
            <Text className="text-[10px] text-slate-400 text-center mt-1">
                Sentuh chart untuk detail
            </Text>
        </View>
    );
}
