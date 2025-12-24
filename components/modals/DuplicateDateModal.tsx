import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
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
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            {/* Close Button */}
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Icon */}
                            <View style={styles.iconContainer}>
                                <AlertCircle size={48} color={colors.warning} />
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>Data Sudah Ada</Text>

                            {/* Description */}
                            <Text style={styles.description}>
                                Sudah ada pembacaan meter untuk tanggal{' '}
                                <Text style={styles.highlight}>
                                    {formatDate(existingReading.date, 'd MMMM yyyy')}
                                </Text>
                                {'\n'}dengan nilai {formatKwh(existingReading.kwh_value, 1)}
                            </Text>

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={onEditExisting}
                                >
                                    <Edit3 size={18} color={colors.primary[600]} />
                                    <Text style={styles.secondaryButtonText}>Edit Data Lama</Text>
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
        color: colors.text,
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
        borderWidth: 2,
        borderColor: colors.primary[500],
        borderRadius: 12,
        backgroundColor: colors.primary[50],
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary[600],
    },
});
