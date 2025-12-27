/**
 * EditReadingModal Component
 * Mode-locked edit modal with full validation, backdate detection, and recalculation
 * Matches Input page (ReadingForm/TopUpForm) validation logic
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/constants/colors';
import { Reading } from '@/types/reading';
import { formatDate, formatDateForApi } from '@/shared/utils/date';
import { formatRupiah, formatRupiahInput, parseRupiah, formatKwh } from '@/shared/utils/rupiah';
import { updateReading, getLastReadingBeforeDate, checkReadingExists, bulkUpdateReadingsKwh, getReadingsAfterDate } from '@/lib/readingService';
import { getSettings } from '@/shared/utils/settings';
import { estimateKwhFromTokenCost, calculateTokenAmount } from '@/shared/utils/tariff';
import {
    checkForBackdate,
    validateBackdateOperation,
    previewBackdateImpact,
    BackdatePreview,
    ValidationIssue,
    TRIGGER_TYPES,
} from '@/shared/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { X, AlertTriangle, Calendar, Zap, DollarSign, FileText, Info } from 'lucide-react-native';

interface EditReadingModalProps {
    visible: boolean;
    reading: Reading | null;
    onClose: () => void;
    onSuccess: () => void;
    onBackdateDetected?: (
        affectedEvents: BackdatePreview[],
        validationIssues: ValidationIssue[],
        kwhOffset: number,
        readingId: string,
        updates: Partial<Reading>
    ) => void;
}

export function EditReadingModal({
    visible,
    reading,
    onClose,
    onSuccess,
    onBackdateDetected,
}: EditReadingModalProps) {
    const { user } = useAuth();

    // Form state
    const [date, setDate] = useState(new Date());
    const [kwhValue, setKwhValue] = useState('');
    const [tokenCost, setTokenCost] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Validation state
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [previousReading, setPreviousReading] = useState<Reading | null>(null);
    const [isBackdate, setIsBackdate] = useState(false);
    const [affectedCount, setAffectedCount] = useState(0);

    // Determine if this is a TopUp entry
    const isTopUp = reading && reading.token_cost && reading.token_cost > 0;
    const themeColor = isTopUp ? colors.accent[500] : colors.primary[500];
    const themeColorLight = isTopUp ? colors.accent[50] : colors.primary[50];

    // Date constraints
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);

    // Initialize form when reading changes
    useEffect(() => {
        if (reading) {
            setDate(new Date(reading.date));
            setKwhValue(reading.kwh_value.toString());
            setTokenCost(reading.token_cost?.toString() || '');
            setTokenAmount(reading.token_amount?.toString() || '');
            setNotes(reading.notes || '');
            setError(null);
            setWarning(null);
        }
    }, [reading]);

    // Fetch previous reading when date changes
    useEffect(() => {
        const fetchPrevious = async () => {
            if (user?.id && visible) {
                const prev = await getLastReadingBeforeDate(user.id, date);
                // Exclude current reading from previous check if it's the same date
                if (prev && reading && prev.id === reading.id) {
                    const beforePrev = await getLastReadingBeforeDate(user.id, new Date(prev.date));
                    setPreviousReading(beforePrev);
                } else {
                    setPreviousReading(prev);
                }
            }
        };
        fetchPrevious();
    }, [user?.id, date, visible, reading]);

    // Check for backdate when date changes (TopUp mode)
    useEffect(() => {
        const checkBackdate = async () => {
            if (user?.id && isTopUp && visible) {
                const result = await checkForBackdate(user.id, formatDateForApi(date));
                // Filter out the current reading being edited from affected count
                const affectedExcludingCurrent = result.affectedEvents.filter(
                    e => reading && e.id !== reading.id
                );
                setIsBackdate(affectedExcludingCurrent.length > 0);
                setAffectedCount(affectedExcludingCurrent.length);
            }
        };
        checkBackdate();
    }, [user?.id, date, isTopUp, visible, reading]);

    // Auto-calculate token amount when cost changes (for TopUp)
    useEffect(() => {
        const calculateAmount = async () => {
            if (isTopUp && tokenCost) {
                const cost = parseFloat(tokenCost);
                if (!isNaN(cost) && cost > 0) {
                    const kwh = await calculateTokenAmount(cost);
                    if (kwh !== null) {
                        setTokenAmount(kwh.toFixed(2));

                        // Auto-calculate new meter position
                        if (previousReading) {
                            const newKwh = previousReading.kwh_value + kwh;
                            setKwhValue(newKwh.toFixed(2));
                        }
                    }
                }
            }
        };
        calculateAmount();
    }, [tokenCost, isTopUp, previousReading]);

    // Validate form (matches Input page validation)
    const validateForm = useCallback((): boolean => {
        setError(null);
        setWarning(null);

        const kwh = parseFloat(kwhValue);
        if (isNaN(kwh) || kwh < 0) {
            setError('Masukkan nilai kWh yang valid');
            return false;
        }

        if (isTopUp) {
            // TopUp validation: kWh should increase
            const cost = parseFloat(tokenCost);
            if (isNaN(cost) || cost <= 0) {
                setError('Masukkan nominal token');
                return false;
            }

            if (previousReading && kwh < previousReading.kwh_value) {
                setError('Nilai kWh setelah top-up harus lebih tinggi dari pembacaan terakhir');
                return false;
            }
        } else {
            // Reading validation: kWh should decrease (consumption)
            if (previousReading && kwh >= previousReading.kwh_value) {
                setWarning('Nilai kWh harus lebih rendah dari pembacaan sebelumnya. Gunakan mode Top Up jika meter bertambah.');
                // Don't block, just warn - user might be correcting data
            }
        }

        return true;
    }, [kwhValue, tokenCost, isTopUp, previousReading]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            // Clamp to valid range
            if (selectedDate > maxDate) setDate(maxDate);
            else if (selectedDate < minDate) setDate(minDate);
            else setDate(selectedDate);
        }
    };

    const handleWebDateChange = (dateString: string) => {
        const newDate = new Date(dateString);
        if (!isNaN(newDate.getTime())) {
            // Preserve time
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());

            if (newDate > maxDate) setDate(maxDate);
            else if (newDate < minDate) setDate(minDate);
            else setDate(newDate);
        }
    };

    const handleSave = async () => {
        if (!reading || !user?.id) return;
        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);

        try {
            const kwh = parseFloat(kwhValue);
            const updates: Partial<Reading> = {
                date: formatDateForApi(date),
                kwh_value: kwh,
                notes: notes.trim() || null,
            };

            if (isTopUp) {
                const cost = parseFloat(tokenCost);
                const amount = parseFloat(tokenAmount);
                if (!isNaN(cost)) updates.token_cost = cost;
                if (!isNaN(amount)) updates.token_amount = amount;

                // Check for backdate recalculation
                if (isBackdate && affectedCount > 0 && onBackdateDetected) {
                    const purchasedKwh = amount || (kwh - (previousReading?.kwh_value || 0));

                    // Calculate the difference from original reading
                    const originalKwh = reading.kwh_value;
                    const kwhOffset = kwh - originalKwh;

                    // Validate
                    const validation = await validateBackdateOperation(
                        user.id,
                        formatDateForApi(date),
                        kwhOffset
                    );

                    // Check for blocking issues
                    const blockingIssues = validation.issues.filter(i => i.severity === 'BLOCK');
                    if (blockingIssues.length > 0) {
                        setError(blockingIssues[0].message);
                        setIsLoading(false);
                        return;
                    }

                    // Preview impact
                    const preview = await previewBackdateImpact(
                        user.id,
                        formatDateForApi(date),
                        kwhOffset
                    );

                    // Filter out current reading
                    const affectedExcludingCurrent = preview.filter(e => e.id !== reading.id);

                    if (affectedExcludingCurrent.length > 0) {
                        setIsLoading(false);
                        onBackdateDetected(
                            affectedExcludingCurrent,
                            validation.issues,
                            kwhOffset,
                            reading.id,
                            updates
                        );
                        return;
                    }
                }
            }

            // Check for duplicate date (if date changed)
            if (formatDateForApi(date) !== formatDateForApi(new Date(reading.date))) {
                const existing = await checkReadingExists(user.id, date);
                if (existing && existing.id !== reading.id) {
                    setError('Sudah ada data pada tanggal ini');
                    setIsLoading(false);
                    return;
                }
            }

            // Direct save (no backdate or Reading mode)
            await updateReading(reading.id, {
                date: formatDateForApi(date),
                kwh: kwh,
                token_cost: updates.token_cost,
                token_amount: updates.token_amount,
                notes: updates.notes,
            });

            // If this is a TopUp and values changed, update future readings
            if (isTopUp && reading.kwh_value !== kwh) {
                const kwhOffset = kwh - reading.kwh_value;
                const futureReadings = await getReadingsAfterDate(user.id, date);
                if (futureReadings.length > 0) {
                    await bulkUpdateReadingsKwh(
                        futureReadings.map(r => r.id),
                        kwhOffset
                    );
                }
            }

            onSuccess();
        } catch (err: any) {
            console.error('Error updating reading:', err);
            setError(err.message || 'Gagal menyimpan perubahan');
        } finally {
            setIsLoading(false);
        }
    };

    if (!reading) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: themeColorLight }]}>
                        <View style={styles.headerContent}>
                            <Text style={[styles.headerTitle, { color: themeColor }]}>
                                {isTopUp ? 'Edit Top Up' : 'Edit Pembacaan'}
                            </Text>
                            {isBackdate && affectedCount > 0 && (
                                <View style={styles.backdateBadge}>
                                    <AlertTriangle size={12} color={colors.accent[700]} />
                                    <Text style={styles.backdateText}>
                                        Akan mempengaruhi {affectedCount} data
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <X size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Date Input */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Tanggal</Text>
                            {Platform.OS === 'web' ? (
                                <View style={[styles.inputWrapper, { borderColor: themeColor }]}>
                                    <Calendar size={18} color={themeColor} />
                                    <TextInput
                                        style={styles.inputWithIcon}
                                        value={date.toISOString().split('T')[0]}
                                        onChangeText={handleWebDateChange}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.inputWrapper, { borderColor: themeColor }]}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Calendar size={18} color={themeColor} />
                                        <Text style={styles.dateText}>{formatDate(date)}</Text>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={date}
                                            mode="date"
                                            display="default"
                                            onChange={handleDateChange}
                                            maximumDate={maxDate}
                                            minimumDate={minDate}
                                        />
                                    )}
                                </>
                            )}
                        </View>

                        {/* Previous Reading Info */}
                        {previousReading && (
                            <View style={styles.infoBox}>
                                <Info size={16} color={colors.primary[600]} />
                                <Text style={styles.infoText}>
                                    Pembacaan sebelumnya: {formatKwh(previousReading.kwh_value, 2)} ({formatDate(new Date(previousReading.date))})
                                </Text>
                            </View>
                        )}

                        {/* TopUp-only fields */}
                        {isTopUp && (
                            <View style={styles.field}>
                                <Text style={styles.label}>Nominal Token (Rp)</Text>
                                <View style={[styles.inputWrapper, { borderColor: themeColor }]}>
                                    <DollarSign size={18} color={themeColor} />
                                    <TextInput
                                        style={styles.inputWithIcon}
                                        value={tokenCost}
                                        onChangeText={setTokenCost}
                                        keyboardType="number-pad"
                                        placeholder="Contoh: 100000"
                                    />
                                </View>
                            </View>
                        )}

                        {/* kWh Value */}
                        <View style={styles.field}>
                            <Text style={styles.label}>
                                {isTopUp ? 'Posisi Meter Baru (kWh)' : 'Posisi Meter (kWh)'}
                            </Text>
                            <View style={[styles.inputWrapper, { borderColor: themeColor }]}>
                                <Zap size={18} color={themeColor} />
                                <TextInput
                                    style={styles.inputWithIcon}
                                    value={kwhValue}
                                    onChangeText={setKwhValue}
                                    keyboardType="decimal-pad"
                                    placeholder="Contoh: 245.50"
                                />
                            </View>
                        </View>

                        {/* Token Amount (auto-calculated, TopUp only) */}
                        {isTopUp && tokenAmount && (
                            <View style={styles.calculatedBox}>
                                <Text style={styles.calculatedLabel}>Estimasi kWh Token:</Text>
                                <Text style={styles.calculatedValue}>+{formatKwh(parseFloat(tokenAmount), 2)}</Text>
                            </View>
                        )}

                        {/* Warning Message */}
                        {warning && (
                            <View style={styles.warningBox}>
                                <AlertTriangle size={16} color={colors.accent[700]} />
                                <Text style={styles.warningText}>{warning}</Text>
                            </View>
                        )}

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorBox}>
                                <AlertTriangle size={16} color={colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Notes */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Catatan (Opsional)</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                <FileText size={18} color={colors.textSecondary} style={{ marginTop: 4 }} />
                                <TextInput
                                    style={[styles.inputWithIcon, styles.textArea]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Tambahkan catatan..."
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelText}>Batal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                { backgroundColor: themeColor },
                                isLoading && styles.buttonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.saveText}>
                                    {isBackdate && affectedCount > 0 ? 'Lanjutkan' : 'Simpan'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    backdateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: colors.accent[100],
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    backdateText: {
        fontSize: 11,
        color: colors.accent[700],
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: 12,
        gap: 10,
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
    },
    inputWithIcon: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    textArea: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    dateText: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary[50],
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.primary[700],
    },
    calculatedBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.accent[50],
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    calculatedLabel: {
        fontSize: 13,
        color: colors.accent[700],
    },
    calculatedValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.accent[700],
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: colors.accent[50],
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.accent[200],
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: colors.accent[700],
        lineHeight: 18,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: colors.error,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
