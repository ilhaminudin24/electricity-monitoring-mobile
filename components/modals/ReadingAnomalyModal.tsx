import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import { AlertTriangle, Zap, ArrowRight, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GradientButton } from '@/components/ui/GradientButton';

interface ReadingAnomalyModalProps {
    visible: boolean;
    onClose: () => void;
    onSwitchToTopUp: () => void;
    onDismiss: () => void;
}

export function ReadingAnomalyModal({
    visible,
    onClose,
    onSwitchToTopUp,
    onDismiss,
}: ReadingAnomalyModalProps) {
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
                                <AlertTriangle size={48} color={colors.warning} />
                            </View>

                            {/* Title */}
                            <Text className="text-xl font-bold text-slate-800 mb-3 text-center">
                                Pembacaan Tidak Wajar
                            </Text>

                            {/* Description */}
                            <Text className="text-sm text-slate-500 text-center leading-[22px] mb-6">
                                Nilai kWh yang dimasukkan <Text className="font-semibold text-warning">lebih tinggi</Text> dari pembacaan sebelumnya.
                                {'\n\n'}
                                Jika Anda baru saja <Text className="font-semibold text-warning">membeli token listrik</Text>, gunakan mode "Top Up Token" untuk mencatat penambahan saldo.
                            </Text>

                            {/* Action Buttons */}
                            <View className="w-full gap-3">
                                <GradientButton
                                    title="Pindah ke Top Up"
                                    onPress={onSwitchToTopUp}
                                    variant="topup"
                                    icon={<Zap size={18} color="#FFFFFF" />}
                                />

                                <TouchableOpacity
                                    className="flex-row items-center justify-center gap-2 py-3.5"
                                    onPress={onDismiss}
                                >
                                    <Text className="text-sm text-slate-500">Saya Salah Input</Text>
                                    <ArrowRight size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
