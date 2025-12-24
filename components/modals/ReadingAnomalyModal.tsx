import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
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
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            {/* Close Button */}
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <AlertTriangle size={48} color={colors.warning} />
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>Pembacaan Tidak Wajar</Text>

                            {/* Description */}
                            <Text style={styles.description}>
                                Nilai kWh yang dimasukkan <Text style={styles.highlight}>lebih tinggi</Text> dari pembacaan sebelumnya.
                                {'\n\n'}
                                Jika Anda baru saja <Text style={styles.highlight}>membeli token listrik</Text>, gunakan mode "Top Up Token" untuk mencatat penambahan saldo.
                            </Text>

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                <GradientButton
                                    title="Pindah ke Top Up"
                                    onPress={onSwitchToTopUp}
                                    variant="topup"
                                    icon={<Zap size={18} color="#FFFFFF" />}
                                />

                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={onDismiss}
                                >
                                    <Text style={styles.secondaryButtonText}>Saya Salah Input</Text>
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    highlight: {
        fontWeight: '600',
        color: colors.warning,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});
