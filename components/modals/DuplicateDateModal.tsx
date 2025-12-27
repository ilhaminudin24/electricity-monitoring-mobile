import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import { AlertCircle, Edit3, RefreshCcw, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GradientButton } from '@/components/ui/GradientButton';
import { formatDate } from '@/shared/utils/date';
import { formatKwh } from '@/shared/utils/rupiah';
import { Reading } from '@/types/reading';

interface DuplicateDateModalProps {
    visible: boolean;
    onClose: () => void;
    existingReading: Reading | null;
    onEditExisting: () => void;
    onReplace: () => void;
    loading?: boolean;
}

export function DuplicateDateModal({
    visible,
    onClose,
    existingReading,
    onEditExisting,
    onReplace,
    loading = false,
}: DuplicateDateModalProps) {
    if (!existingReading) return null;

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
                        <View className="bg-white rounded-[20px] p-6 w-full max-w-[340px] items-center">
                            {/* Close Button */}
                            <TouchableOpacity
                                className="absolute top-3 right-3 p-2"
                                onPress={onClose}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Icon */}
                            <View className="mb-4">
                                <AlertCircle size={48} color={colors.warning} />
                            </View>

                            {/* Title */}
                            <Text className="text-xl font-bold text-slate-800 mb-3 text-center">
                                Data Sudah Ada
                            </Text>

                            {/* Description */}
                            <Text className="text-sm text-slate-500 text-center leading-[22px] mb-6">
                                Sudah ada pembacaan meter untuk tanggal{' '}
                                <Text className="font-semibold text-slate-800">
                                    {formatDate(existingReading.date, 'd MMMM yyyy')}
                                </Text>
                                {'\n'}dengan nilai {formatKwh(existingReading.kwh_value, 1)}
                            </Text>

                            {/* Action Buttons */}
                            <View className="w-full gap-3">
                                <TouchableOpacity
                                    className="flex-row items-center justify-center gap-2 py-3.5 border-2 border-primary-500 rounded-xl bg-primary-50"
                                    onPress={onEditExisting}
                                >
                                    <Edit3 size={18} color={colors.primary[600]} />
                                    <Text className="text-base font-semibold text-primary-600">
                                        Edit Data Lama
                                    </Text>
                                </TouchableOpacity>

                                <GradientButton
                                    title={loading ? "Menyimpan..." : "Ganti dengan Baru"}
                                    onPress={onReplace}
                                    variant="danger"
                                    loading={loading}
                                    icon={<RefreshCcw size={18} color="#FFFFFF" />}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
