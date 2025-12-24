import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { TabSelector } from '@/components/input/TabSelector';
import { ReadingForm } from '@/components/input/ReadingForm';
import { TopUpForm } from '@/components/input/TopUpForm';
import { DuplicateDateModal } from '@/components/modals/DuplicateDateModal';
import { ReadingAnomalyModal } from '@/components/modals/ReadingAnomalyModal';
import { deleteReading, addReading } from '@/lib/readingService';
import { useAuth } from '@/contexts/AuthContext';
import type { InputMode, Reading, ReadingInput } from '@/types/reading';

export default function InputScreen() {
    const { user } = useAuth();
    const [mode, setMode] = useState<InputMode>('reading');
    const [showAnomalyModal, setShowAnomalyModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateReading, setDuplicateReading] = useState<Reading | null>(null);
    const [editingReading, setEditingReading] = useState<Reading | null>(null);
    const [replacingReadingId, setReplacingReadingId] = useState<string | null>(null);
    const [isReplacing, setIsReplacing] = useState(false);

    // Store pending form data for direct save on replace
    const pendingFormDataRef = useRef<{
        data: ReadingInput;
        photoUri?: string | null;
    } | null>(null);

    const handleAnomalyDetected = () => {
        setShowAnomalyModal(true);
    };

    const handleSwitchToTopUp = () => {
        setShowAnomalyModal(false);
        setMode('topup');
    };

    const handleDuplicateDate = useCallback((existingReading: Reading, formData?: ReadingInput, photoUri?: string | null) => {
        setDuplicateReading(existingReading);
        // Store pending form data for direct save
        if (formData) {
            pendingFormDataRef.current = { data: formData, photoUri };
        }
        setShowDuplicateModal(true);
    }, []);

    const handleEditExisting = () => {
        if (duplicateReading) {
            setEditingReading(duplicateReading);
            setShowDuplicateModal(false);
            pendingFormDataRef.current = null;
        }
    };

    // Direct save on replace - no second click needed
    const handleReplace = async () => {
        if (!duplicateReading || !user?.id || !pendingFormDataRef.current) {
            // Fallback to old behavior if no pending data
            if (duplicateReading) {
                setReplacingReadingId(duplicateReading.id);
                setShowDuplicateModal(false);
            }
            return;
        }

        setIsReplacing(true);

        try {
            const { data: formData, photoUri } = pendingFormDataRef.current;

            // Delete the old reading first
            await deleteReading(duplicateReading.id);

            // Then add the new one
            await addReading(user.id, formData, photoUri);

            setShowDuplicateModal(false);
            pendingFormDataRef.current = null;

            Alert.alert('Berhasil', 'Data lama berhasil diganti dengan data baru!', [
                {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)')
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal mengganti data');
        } finally {
            setIsReplacing(false);
        }
    };

    const handleEditComplete = () => {
        setEditingReading(null);
    };

    const handleReplaceComplete = () => {
        setReplacingReadingId(null);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Input Meter</Text>
                <Text style={styles.subtitle}>Catat pembacaan meter atau top-up token</Text>
            </View>

            {/* Tab Selector */}
            <TabSelector mode={mode} onModeChange={setMode} />

            {/* Form Content */}
            {mode === 'reading' ? (
                <ReadingForm
                    onAnomalyDetected={handleAnomalyDetected}
                    onDuplicateDate={handleDuplicateDate}
                    editingReading={editingReading}
                    onEditComplete={handleEditComplete}
                    replacingReadingId={replacingReadingId}
                    onReplaceComplete={handleReplaceComplete}
                />
            ) : (
                <TopUpForm
                    onDuplicateDate={handleDuplicateDate}
                    editingReading={editingReading}
                    onEditComplete={handleEditComplete}
                    replacingReadingId={replacingReadingId}
                    onReplaceComplete={handleReplaceComplete}
                />
            )}

            {/* Modals */}
            <ReadingAnomalyModal
                visible={showAnomalyModal}
                onClose={() => setShowAnomalyModal(false)}
                onSwitchToTopUp={handleSwitchToTopUp}
                onDismiss={() => setShowAnomalyModal(false)}
            />

            <DuplicateDateModal
                visible={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                existingReading={duplicateReading}
                onEditExisting={handleEditExisting}
                onReplace={handleReplace}
                loading={isReplacing}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 4,
    },
});
