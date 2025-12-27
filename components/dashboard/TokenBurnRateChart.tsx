import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Line, Area, useChartPressState } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { colors } from '@/constants/colors';
import { BurnRateProjection } from '@/shared/utils/analytics';

interface TokenBurnRateChartProps {
    burnRateData: BurnRateProjection | null;
    loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;
const CHART_HEIGHT = 160;

export function TokenBurnRateChart({ burnRateData, loading }: TokenBurnRateChartProps) {
    const hasData = burnRateData?.hasData ?? false;
    const projectionData = burnRateData?.projectionData || [];
    const remainingKwh = burnRateData?.remainingKwh || 0;
    const daysRemaining = burnRateData?.daysUntilDepletion;
    const depletionDate = burnRateData?.predictedDepletionDate;
    const avgDailyUsage = burnRateData?.avgDailyUsage || 0;
    const isCritical = burnRateData?.isCritical || false;
    const isWarning = burnRateData?.isWarning || false;

    // Touch interaction state
    const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

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

    // Format date for display
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), 'd MMM yyyy', { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    // Format short date
    const formatShortDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), 'd MMM', { locale: idLocale });
        } catch {
            return dateStr;
        }
    };

    // Prepare chart data
    const getChartData = () => {
        if (!projectionData || projectionData.length === 0) return [];

        // Sample evenly for readability (max 15 points)
        const chartPoints = projectionData.filter((_: unknown, i: number) =>
            i === 0 ||
            i === projectionData.length - 1 ||
            i % Math.ceil(projectionData.length / 15) === 0
        ).slice(0, 15);

        return chartPoints.map((d, index) => ({
            x: index,
            y: d.kwhRemaining,
            date: d.date,
            daysFromNow: differenceInDays(new Date(d.date), new Date()),
        }));
    };

    const chartData = getChartData();

    // Get active tooltip data when user touches chart
    const activeData = isActive && state.x.value !== undefined
        ? chartData[Math.round(state.x.value.value)]
        : null;

    if (loading) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="mb-3">
                    <Text className="text-base font-semibold text-slate-800">
                        Proyeksi Token
                    </Text>
                </View>
                <View className="h-[200px] justify-center items-center">
                    <Text className="text-slate-500">Memuat...</Text>
                </View>
            </View>
        );
    }

    if (!hasData || chartData.length === 0) {
        return (
            <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
                <View className="mb-3">
                    <Text className="text-base font-semibold text-slate-800">
                        Proyeksi Token
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                        Berdasarkan rata-rata 30 hari
                    </Text>
                </View>
                <View className="h-[150px] justify-center items-center gap-1">
                    <Text className="text-sm text-slate-500">Belum ada data token</Text>
                    <Text className="text-xs text-slate-500 opacity-70">
                        Tambahkan top-up untuk melihat proyeksi
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="bg-surface rounded-2xl p-4 mx-6 mb-3 border border-border">
            {/* Header with Status */}
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <Text className="text-base font-semibold text-slate-800">
                        Proyeksi Token
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                        Berdasarkan rata-rata 30 hari
                    </Text>
                </View>
                <View
                    className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl"
                    style={{ backgroundColor: status.bgColor }}
                >
                    <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: status.color }}
                    />
                    <Text
                        className="text-[11px] font-semibold"
                        style={{ color: status.color }}
                    >
                        {status.label}
                    </Text>
                </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-between mb-3">
                <View className="flex-1 items-center p-2.5 bg-white rounded-xl mx-1">
                    <Text className="text-lg font-bold text-slate-800">
                        {remainingKwh.toFixed(1)}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">kWh tersisa</Text>
                </View>
                <View className="flex-1 items-center p-2.5 bg-white rounded-xl mx-1">
                    <Text
                        className="text-lg font-bold"
                        style={{ color: status.color }}
                    >
                        {daysRemaining !== null ? daysRemaining : '-'}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">hari lagi</Text>
                </View>
                <View className="flex-1 items-center p-2.5 bg-white rounded-xl mx-1">
                    <Text className="text-lg font-bold text-slate-800">
                        {formatShortDate(depletionDate ?? null)}
                    </Text>
                    <Text className="text-[10px] text-slate-500 mt-0.5">perkiraan habis</Text>
                </View>
            </View>

            {/* Tooltip - shown when user touches chart */}
            {activeData && isActive && (
                <View className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-slate-100">
                    <View className="flex-row items-center gap-2 mb-2">
                        <Text className="text-sm font-semibold text-slate-800">
                            📅 {formatDate(activeData.date)}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-500">Sisa Token</Text>
                            <Text className="text-base font-bold" style={{ color: status.color }}>
                                {activeData.y?.toFixed(1) || '0.0'} kWh
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-500">Pemakaian/Hari</Text>
                            <Text className="text-base font-bold text-slate-800">
                                {avgDailyUsage.toFixed(2)} kWh
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] text-slate-500">Hari ke-</Text>
                            <Text className="text-base font-bold text-slate-800">
                                {activeData.daysFromNow > 0 ? `+${activeData.daysFromNow}` : activeData.daysFromNow}
                            </Text>
                        </View>
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
                                    color={status.color}
                                    opacity={0.2}
                                    curveType="natural"
                                />
                                <Line
                                    points={points.y}
                                    color={status.color}
                                    strokeWidth={2}
                                    curveType="natural"
                                />
                                {/* Active indicator dot */}
                                {isActive && state.y.y.position && (
                                    <Circle
                                        cx={state.x.position.value}
                                        cy={state.y.y.position.value}
                                        r={6}
                                        color={status.color}
                                    />
                                )}
                                {/* Dots at endpoints */}
                                {points.y
                                    .filter((_: any, i: number) => i === 0 || i === points.y.length - 1)
                                    .map((point: any, index: number) => {
                                        if (point.y === undefined || point.y === null) return null;
                                        return (
                                            <Circle
                                                key={index}
                                                cx={point.x}
                                                cy={point.y}
                                                r={4}
                                                color={status.color}
                                            />
                                        );
                                    })}
                            </>
                        )}
                    </CartesianChart>
                </View>

                {/* X-Axis Labels */}
                <View className="flex-row justify-between w-full px-2 mt-1">
                    <Text className="text-[10px] text-slate-400">Hari Ini</Text>
                    <Text className="text-[10px] text-slate-400">
                        {chartData.length > 0
                            ? formatShortDate(chartData[chartData.length - 1].date)
                            : ''}
                    </Text>
                </View>
            </View>

            {/* Footer with touch hint */}
            <Text className="text-[11px] text-slate-500 text-center mt-2">
                Rata-rata:{' '}
                <Text className="font-semibold text-slate-800">
                    {avgDailyUsage.toFixed(2)} kWh/hari
                </Text>
                {' '}• Sentuh chart untuk detail
            </Text>
        </View>
    );
}
