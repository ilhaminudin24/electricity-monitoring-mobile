import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
import { AlertTriangle, ArrowRight, Check, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GradientButton } from '@/components/ui/GradientButton';
import { formatDate } from '@/shared/utils/date';
import { formatKwh } from '@/shared/utils/rupiah';
import { Reading } from '@/types/reading';

interface RecalculationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    affectedReadings: Reading[];
    kwhOffset: number;
}

export function RecalculationModal({
    visible,
    onClose,
    onConfirm,
    loading = false,
    affectedReadings,
    kwhOffset,
}: RecalculationModalProps) {
    // Don't render anything if not visible or no affected readings
    if (!visible || affectedReadings.length === 0) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 bg-black/50 justify-center items-center p-6">
                    <TouchableWithoutFeedback>
                        <View className="bg-white rounded-[20px] p-6 w-full max-w-[380px]">
                            {/* Close Button */}
                            <TouchableOpacity
                                className="absolute top-3 right-3 p-2 z-10"
                                onPress={onClose}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Icon */}
                            <View className="items-center mb-4">
                                <AlertTriangle size={48} color={colors.warning} />
                            </View>

                            {/* Title */}
                            <Text className="text-xl font-bold text-slate-800 mb-2 text-center">
                                Recalculation Diperlukan
                            </Text>

                            {/* Description */}
                            <Text className="text-sm text-slate-500 text-center leading-[22px] mb-4">
                                Top-up ini akan mempengaruhi{' '}
                                <Text className="font-semibold text-slate-800">
                                    {affectedReadings.length} pembacaan
                                </Text>
                                {' '}setelahnya. Semua nilai akan ditambah{' '}
                                <Text className="font-semibold text-topup">
                                    +{formatKwh(kwhOffset, 2)}
                                </Text>
                            </Text>

                            {/* Preview of affected readings */}
                            <View className="bg-slate-50 rounded-xl p-3 mb-4 max-h-48">
                                <Text className="text-xs font-semibold text-slate-500 mb-2 uppercase">
                                    Preview Perubahan
                                </Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {affectedReadings.slice(0, 5).map((reading, index) => (
                                        <View
                                            key={reading.id}
                                            className="flex-row items-center justify-between py-2 border-b border-slate-200 last:border-b-0"
                                        >
                                            <Text className="text-xs text-slate-500">
                                                {formatDate(reading.date, 'd MMM yyyy')}
                                            </Text>
                                            <View className="flex-row items-center gap-2">
                                                <Text className="text-xs text-slate-400">
                                                    {formatKwh(reading.kwh_value, 1)}
                                                </Text>
                                                <ArrowRight size={12} color={colors.textSecondary} />
                                                <Text className="text-xs font-semibold text-success">
                                                    {formatKwh(reading.kwh_value + kwhOffset, 1)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                    {affectedReadings.length > 5 && (
                                        <Text className="text-xs text-slate-400 text-center mt-2">
                                            +{affectedReadings.length - 5} lainnya
                                        </Text>
                                    )}
                                </ScrollView>
                            </View>

                            {/* Action Buttons */}
                            <View className="w-full gap-3">
                                <GradientButton
                                    title={loading ? "Memproses..." : "Konfirmasi Recalculation"}
                                    onPress={onConfirm}
                                    variant="topup"
                                    loading={loading}
                                    icon={<Check size={18} color="#FFFFFF" />}
                                />

                                <TouchableOpacity
                                    className="flex-row items-center justify-center gap-2 py-3.5 border border-slate-300 rounded-xl"
                                    onPress={onClose}
                                    disabled={loading}
                                >
                                    <Text className="text-base font-semibold text-slate-600">
                                        Batal
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
