/**
 * DeleteConfirmModal Component
 * Confirmation dialog for deleting readings
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { AlertTriangle } from 'lucide-react-native';

interface DeleteConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function DeleteConfirmModal({
    visible,
    onClose,
    onConfirm,
    isLoading = false,
}: DeleteConfirmModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <AlertTriangle size={32} color={colors.error} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Hapus Data?</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelText}>Batal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
                            onPress={onConfirm}
                            disabled={isLoading}
                        >
                            <Text style={styles.deleteText}>
                                {isLoading ? 'Menghapus...' : 'Hapus'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
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
    modal: {
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    deleteButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.error,
        alignItems: 'center',
    },
    deleteText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
