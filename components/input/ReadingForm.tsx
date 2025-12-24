import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    TextInput,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Zap, FileText, Save } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ConsumptionPreview } from './ConsumptionPreview';
import { PhotoCapture } from './PhotoCapture';
import { useAuth } from '@/contexts/AuthContext';
import { getLastReading, getLastReadingBeforeDate, addReading, updateReading, checkReadingExists, deleteReading } from '@/lib/readingService';
import { getSettings, loadSettings, getTariffPerKwh } from '@/shared/utils/settings';
import { formatDate, formatDateForApi } from '@/shared/utils/date';
import { Reading, ReadingInput } from '@/types/reading';
import { router } from 'expo-router';

interface ReadingFormProps {
    onAnomalyDetected?: () => void;
    onDuplicateDate?: (existingReading: Reading, formData?: ReadingInput, photoUri?: string | null) => void;
    editingReading?: Reading | null;
    onEditComplete?: () => void;
    replacingReadingId?: string | null;
    onReplaceComplete?: () => void;
}

export function ReadingForm({
    onAnomalyDetected,
    onDuplicateDate,
    editingReading,
    onEditComplete,
    replacingReadingId,
    onReplaceComplete,
}: ReadingFormProps) {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [kwhValue, setKwhValue] = useState('');
    const [notes, setNotes] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastReading, setLastReading] = useState<Reading | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    // Fetch last reading before selected date (date-aware validation)
    useEffect(() => {
        const fetchPreviousReading = async () => {
            if (user?.id) {
                const last = await getLastReadingBeforeDate(user.id, date);
                setLastReading(last);
            }
        };
        fetchPreviousReading();
    }, [user?.id, date]);

    // Handle editing mode - pre-fill form with existing data
    useEffect(() => {
        if (editingReading) {
            setDate(new Date(editingReading.date));
            setKwhValue(String(editingReading.kwh_value));
            setNotes(editingReading.notes || '');
        }
    }, [editingReading]);

    // Reset form to initial state
    const resetForm = () => {
        setDate(new Date());
        setKwhValue('');
        setNotes('');
        setPhotoUri(null);
        setError(null);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleWebDateChange = (dateString: string) => {
        if (dateString) {
            const newDate = new Date(dateString + 'T00:00:00');
            if (!isNaN(newDate.getTime())) {
                setDate(newDate);
            }
        }
    };

    const validateForm = (): boolean => {
        if (!kwhValue.trim()) {
            setError('Masukkan nilai kWh');
            return false;
        }

        const kwhNum = parseFloat(kwhValue);
        if (isNaN(kwhNum) || kwhNum < 0) {
            setError('Nilai kWh tidak valid');
            return false;
        }

        // Check if reading increased (anomaly)
        if (lastReading && kwhNum > lastReading.kwh_value) {
            // Reading increased - user might have topped up
            if (onAnomalyDetected) {
                onAnomalyDetected();
            }
            return false;
        }

        setError(null);
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !user?.id) return;

        setLoading(true);
        setError(null);

        try {
            // If we're editing an existing reading
            if (editingReading) {
                await updateReading(editingReading.id, {
                    date: formatDateForApi(date),
                    kwh: parseFloat(kwhValue),
                    notes: notes.trim() || null,
                });

                Alert.alert('Berhasil', 'Pembacaan meter berhasil diupdate!', [
                    {
                        text: 'OK', onPress: () => {
                            resetForm();
                            onEditComplete?.();
                            router.replace('/(tabs)');
                        }
                    }
                ]);
                return;
            }

            // If we're replacing an existing reading
            if (replacingReadingId) {
                // Delete the old reading first
                await deleteReading(replacingReadingId);

                // Then add the new one
                await addReading(
                    user.id,
                    {
                        date: formatDateForApi(date),
                        kwh: parseFloat(kwhValue),
                        notes: notes.trim() || null,
                    },
                    photoUri
                );

                Alert.alert('Berhasil', 'Data lama berhasil diganti dengan data baru!', [
                    {
                        text: 'OK', onPress: () => {
                            resetForm();
                            onReplaceComplete?.();
                            router.replace('/(tabs)');
                        }
                    }
                ]);
                return;
            }

            // Normal flow - check for duplicate date
            const existing = await checkReadingExists(user.id, date);
            if (existing) {
                setLoading(false);
                if (onDuplicateDate) {
                    // Pass form data for direct save on replace
                    const formData: ReadingInput = {
                        date: formatDateForApi(date),
                        kwh: parseFloat(kwhValue),
                        notes: notes.trim() || null,
                    };
                    onDuplicateDate(existing, formData, photoUri);
                }
                return;
            }

            // Add reading
            await addReading(
                user.id,
                {
                    date: formatDateForApi(date),
                    kwh: parseFloat(kwhValue),
                    notes: notes.trim() || null,
                },
                photoUri
            );

            Alert.alert('Berhasil', 'Pembacaan meter berhasil disimpan!', [
                {
                    text: 'OK', onPress: () => {
                        resetForm();
                        router.replace('/(tabs)');
                    }
                }
            ]);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan pembacaan');
        } finally {
            setLoading(false);
        }
    };

    const kwhNum = parseFloat(kwhValue) || 0;
    const tariff = getTariffPerKwh();

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <GlassCard variant="reading">
                <Text style={styles.cardTitle}>Catat Pembacaan Meter</Text>

                {/* Date Picker */}
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Tanggal</Text>
                    {Platform.OS === 'web' ? (
                        <View style={styles.dateButton}>
                            <Calendar size={20} color={colors.reading} />
                            <TextInput
                                value={date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChangeText={(text) => handleWebDateChange(text)}
                                style={styles.webDateInput}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={20} color={colors.reading} />
                                <Text style={styles.dateText}>{formatDate(date, 'EEEE, d MMMM yyyy')}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                />
                            )}
                        </>
                    )}
                </View>

                {/* kWh Input */}
                <Input
                    label="Pembacaan Meter (kWh)"
                    placeholder="Contoh: 145.5"
                    value={kwhValue}
                    onChangeText={setKwhValue}
                    keyboardType="decimal-pad"
                    variant="reading"
                    leftIcon={<Zap size={20} color={colors.reading} />}
                    error={error || undefined}
                />

                {/* Consumption Preview */}
                {kwhNum > 0 && (
                    <ConsumptionPreview
                        previousReading={lastReading?.kwh_value ?? null}
                        currentReading={kwhNum}
                        tariffPerKwh={tariff}
                    />
                )}

                {/* Notes */}
                <Input
                    label="Catatan (Opsional)"
                    placeholder="Tambahkan catatan..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    variant="reading"
                    leftIcon={<FileText size={20} color={colors.textSecondary} />}
                />

                {/* Photo Capture */}
                <PhotoCapture
                    photoUri={photoUri}
                    onPhotoChange={setPhotoUri}
                    variant="reading"
                />

                {/* Submit Button */}
                <View style={styles.submitContainer}>
                    <GradientButton
                        title="Simpan Pembacaan"
                        onPress={handleSubmit}
                        loading={loading}
                        variant="reading"
                        icon={<Save size={20} color="#FFFFFF" />}
                    />
                </View>
            </GlassCard>

            {/* Info Card */}
            <GlassCard style={styles.infoCard}>
                <Text style={styles.infoTitle}>💡 Tips</Text>
                <Text style={styles.infoText}>
                    • Catat pembacaan meter secara rutin untuk tracking akurat{'\n'}
                    • Pastikan nilai kWh lebih kecil dari pembacaan terakhir{'\n'}
                    • Jika membeli token, gunakan mode "Top Up Token"
                </Text>
            </GlassCard>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 20,
    },
    dateContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 6,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 16,
        color: colors.text,
    },
    webDateInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        backgroundColor: 'transparent',
    },
    submitContainer: {
        marginTop: 24,
    },
    infoCard: {
        marginTop: 16,
        backgroundColor: '#EEF2FF',
        borderColor: '#E0E7FF',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});
