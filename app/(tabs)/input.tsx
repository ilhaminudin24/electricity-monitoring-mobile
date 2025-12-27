import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { TabSelector } from '@/components/input/TabSelector';
import { ReadingForm } from '@/components/input/ReadingForm';
import { TopUpForm } from '@/components/input/TopUpForm';
import { DuplicateDateModal } from '@/components/modals/DuplicateDateModal';
import { ReadingAnomalyModal } from '@/components/modals/ReadingAnomalyModal';
import { RecalculationTimelineModal } from '@/components/modals/RecalculationTimelineModal';
import { deleteReading, addReading, bulkUpdateReadingsKwh, getReadingsAfterDate } from '@/lib/readingService';
import {
    addEvent,
    performCascadingRecalculation,
    EVENT_TYPES,
    TRIGGER_TYPES,
    BackdatePreview,
    ValidationIssue,
} from '@/shared/services/eventService';
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

    // Backdate recalculation state (Event Sourcing)
    const [showRecalculationModal, setShowRecalculationModal] = useState(false);
    const [affectedEvents, setAffectedEvents] = useState<BackdatePreview[]>([]);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [kwhOffset, setKwhOffset] = useState(0);
    const [tokenCost, setTokenCost] = useState(0);
    const [isRecalculating, setIsRecalculating] = useState(false);

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

    // Handle backdate detection from TopUpForm (Event Sourcing)
    const handleBackdateDetected = useCallback((
        events: BackdatePreview[],
        issues: ValidationIssue[],
        offset: number,
        formData: ReadingInput,
        photoUri?: string | null
    ) => {
        setAffectedEvents(events);
        setValidationIssues(issues);
        setKwhOffset(offset);
        setTokenCost(formData.token_cost || 0);
        pendingFormDataRef.current = { data: formData, photoUri };
        setShowRecalculationModal(true);
    }, []);

    // Confirm recalculation with DUAL-WRITE pattern
    const handleRecalculationConfirm = async () => {
        if (affectedEvents.length === 0 || !user?.id || !pendingFormDataRef.current) return;

        setIsRecalculating(true);

        try {
            const { data: formData, photoUri } = pendingFormDataRef.current;

            // 1. Save to OLD table first (electricity_readings) for backward compat
            const savedReading = await addReading(user.id, formData, photoUri);

            // 2. Track in NEW event sourcing system (token_events)
            const eventResult = await addEvent(user.id, {
                eventType: EVENT_TYPES.TOPUP,
                eventDate: formData.date,
                kwhAmount: kwhOffset, // This is the OFFSET, not total
                tokenCost: formData.token_cost || undefined,
                notes: formData.notes || undefined,
            });

            // 3. Create recalculation batch for audit & rollback
            if (affectedEvents.length > 0) {
                await performCascadingRecalculation(
                    user.id,
                    eventResult.event.id,
                    TRIGGER_TYPES.BACKDATE_TOPUP,
                    affectedEvents,
                    kwhOffset
                );
            }

            // 4. Update affected readings in OLD table (electricity_readings)
            const readingsFromOldTable = await getReadingsAfterDate(user.id, formData.date);
            if (readingsFromOldTable.length > 0) {
                const updates = readingsFromOldTable.map(r => ({
                    id: r.id,
                    kwh_value: r.kwh_value + kwhOffset
                }));
                await bulkUpdateReadingsKwh(updates);
            }

            setShowRecalculationModal(false);
            setAffectedEvents([]);
            setValidationIssues([]);
            setKwhOffset(0);
            setTokenCost(0);
            pendingFormDataRef.current = null;

            Alert.alert('Berhasil', `Top-up berhasil disimpan dan ${readingsFromOldTable.length} pembacaan telah di-update!`, [
                {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)')
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal melakukan recalculation');
        } finally {
            setIsRecalculating(false);
        }
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
                    onBackdateDetected={handleBackdateDetected}
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

            <RecalculationTimelineModal
                visible={showRecalculationModal}
                onClose={() => setShowRecalculationModal(false)}
                onConfirm={handleRecalculationConfirm}
                loading={isRecalculating}
                affectedEvents={affectedEvents}
                validationIssues={validationIssues}
                newTopupKwh={kwhOffset}
                newTopupDate={pendingFormDataRef.current?.data.date || ''}
                tokenCost={tokenCost}
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
