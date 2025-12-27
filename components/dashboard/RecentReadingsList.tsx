import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronRight, Zap, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Reading, sortReadingsChronologically } from '@/shared/utils/analytics';

interface RecentReadingsListProps {
    readings: Reading[];
    onItemPress?: (reading: Reading) => void;
    loading?: boolean;
}

export function RecentReadingsList({ readings, onItemPress, loading }: RecentReadingsListProps) {
    // Get last 5 readings sorted by date (newest first)
    const recentReadings = sortReadingsChronologically(readings)
        .slice(-5)
        .reverse();

    const isTopUp = (reading: Reading) =>
        reading.token_cost !== null && reading.token_cost !== undefined && reading.token_cost > 0;

    const calculateConsumption = (reading: Reading, index: number) => {
        const sortedByDate = sortReadingsChronologically(readings);
        const currentIndex = sortedByDate.findIndex(r => r.id === reading.id);

        if (currentIndex <= 0) return null;

        const prevReading = sortedByDate[currentIndex - 1];
        const consumption = prevReading.kwh_value - reading.kwh_value;

        return consumption > 0 ? consumption : null;
    };

    const renderItem = ({ item, index }: { item: Reading; index: number }) => {
        const topUp = isTopUp(item);
        const consumption = calculateConsumption(item, index);

        return (
            <TouchableOpacity
                className="flex-row items-center py-2.5"
                onPress={() => onItemPress?.(item)}
                activeOpacity={0.7}
            >
                <View
                    className="w-9 h-9 rounded-[10px] justify-center items-center mr-3"
                    style={{ backgroundColor: topUp ? `${colors.topup}15` : `${colors.reading}15` }}
                >
                    {topUp ? (
                        <Zap size={16} color={colors.topup} />
                    ) : (
                        <TrendingDown size={16} color={colors.reading} />
                    )}
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-[13px] text-slate-500">
                            {format(new Date(item.date), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                        </Text>
                        <View
                            className="px-2 py-0.5 rounded"
                            style={{ backgroundColor: topUp ? `${colors.topup}15` : `${colors.reading}15` }}
                        >
                            <Text
                                className="text-[10px] font-semibold"
                                style={{ color: topUp ? colors.topup : colors.reading }}
                            >
                                {topUp ? 'Top Up' : 'Reading'}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <Text className="text-[15px] font-semibold text-slate-800 mt-1">
                            {item.kwh_value.toFixed(1)} kWh
                        </Text>
                        {consumption !== null && !topUp && (
                            <Text className="text-[13px] font-medium text-reading">
                                -{consumption.toFixed(1)} kWh
                            </Text>
                        )}
                        {topUp && item.token_amount && (
                            <Text className="text-[13px] font-medium text-topup">
                                +{item.token_amount.toFixed(1)} kWh
                            </Text>
                        )}
                    </View>
                </View>

                <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    return (
        <View className="bg-surface rounded-2xl p-4 mx-6 mb-6 border border-border">
            <View className="mb-3">
                <Text className="text-base font-semibold text-slate-800">Catatan Terbaru</Text>
                <Text className="text-xs text-slate-500 mt-0.5">5 pencatatan terakhir</Text>
            </View>

            {loading ? (
                <View className="h-[100px] justify-center items-center">
                    <Text className="text-slate-500">Memuat...</Text>
                </View>
            ) : recentReadings.length > 0 ? (
                <FlatList
                    data={recentReadings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View className="h-px bg-border my-1" />}
                />
            ) : (
                <View className="py-6 items-center">
                    <Text className="text-sm text-slate-500 text-center leading-5">
                        Belum ada catatan. Mulai catat penggunaan di tab "Input".
                    </Text>
                </View>
            )}
        </View>
    );
}
