import React from 'react';
import { View, Text } from 'react-native';
import { ArrowDown, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { formatRupiah, formatKwh } from '@/shared/utils/rupiah';
import { GlassCard } from '@/components/ui/GlassCard';

interface ConsumptionPreviewProps {
    previousReading: number | null;
    currentReading: number;
    tariffPerKwh: number;
}

export function ConsumptionPreview({
    previousReading,
    currentReading,
    tariffPerKwh,
}: ConsumptionPreviewProps) {
    if (previousReading === null) {
        return null;
    }

    const consumption = previousReading - currentReading;
    const estimatedCost = consumption * tariffPerKwh;
    const isValid = consumption >= 0;

    if (!isValid) {
        return (
            <GlassCard className="mt-4 bg-red-50 border-error">
                <View className="flex-row items-start gap-2">
                    <Text className="text-xl">⚠️</Text>
                    <Text className="flex-1 text-sm text-error leading-5">
                        Pembacaan meter baru ({formatKwh(currentReading, 1)}) lebih tinggi dari pembacaan terakhir ({formatKwh(previousReading, 1)}).
                        {'\n'}Gunakan mode "Top Up Token" jika Anda membeli token listrik.
                    </Text>
                </View>
            </GlassCard>
        );
    }

    return (
        <GlassCard variant="reading" className="mt-4">
            <View className="flex-row items-center gap-2 mb-4">
                <TrendingDown size={20} color={colors.reading} />
                <Text className="text-base font-semibold text-slate-800">Pratinjau Konsumsi</Text>
            </View>

            <View>
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 items-center">
                        <Text className="text-xs text-slate-500 mb-1">Meter Sebelumnya</Text>
                        <Text className="text-lg font-semibold text-slate-800">{formatKwh(previousReading, 1)}</Text>
                    </View>

                    <ArrowDown size={24} color={colors.textSecondary} />

                    <View className="flex-1 items-center">
                        <Text className="text-xs text-slate-500 mb-1">Meter Sekarang</Text>
                        <Text className="text-lg font-semibold text-slate-800">{formatKwh(currentReading, 1)}</Text>
                    </View>
                </View>

                <View className="h-px bg-border my-4" />

                <View className="flex-row justify-around">
                    <View className="items-center">
                        <Text className="text-xs text-slate-500 mb-1">Konsumsi</Text>
                        <Text className="text-xl font-bold text-reading">
                            {formatKwh(consumption, 2)}
                        </Text>
                    </View>

                    <View className="items-center">
                        <Text className="text-xs text-slate-500 mb-1">Est. Biaya</Text>
                        <Text className="text-xl font-bold text-secondary-600">
                            {formatRupiah(estimatedCost)}
                        </Text>
                    </View>
                </View>
            </View>
        </GlassCard>
    );
}
