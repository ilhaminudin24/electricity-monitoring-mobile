import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Zap, FileText, Save } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ConsumptionPreview } from './ConsumptionPreview';
import { PhotoCapture } from './PhotoCapture';
import { useAuth } from '@/contexts/AuthContext';
import { getLastReadingBeforeDate, addReading, updateReading, checkReadingExists, deleteReading } from '@/lib/readingService';
import { loadSettings, getTariffPerKwh } from '@/shared/utils/settings';
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

    // Date constraints: max = today, min = 30 days ago
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        const fetchPreviousReading = async () => {
            if (user?.id) {
                const last = await getLastReadingBeforeDate(user.id, date);
                setLastReading(last);
            }
        };
        fetchPreviousReading();
    }, [user?.id, date]);

    useEffect(() => {
        if (editingReading) {
            setDate(new Date(editingReading.date));
            setKwhValue(String(editingReading.kwh_value));
            setNotes(editingReading.notes || '');
        }
    }, [editingReading]);

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
            if (!isNaN(newDate.getTime()) && newDate >= minDate && newDate <= maxDate) {
                setDate(newDate);
            } else if (!isNaN(newDate.getTime())) {
                // Clamp to valid range
                if (newDate > maxDate) setDate(maxDate);
                else if (newDate < minDate) setDate(minDate);
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

        if (lastReading && kwhNum > lastReading.kwh_value) {
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
            if (editingReading) {
                await updateReading(editingReading.id, {
                    date: formatDateForApi(date),
                    kwh: parseFloat(kwhValue),
                    notes: notes.trim() || null,
                });

                Alert.alert('Berhasil', 'Pembacaan meter berhasil diupdate!', [
                    { text: 'OK', onPress: () => { resetForm(); onEditComplete?.(); router.replace('/(tabs)'); } }
                ]);
                return;
            }

            if (replacingReadingId) {
                await deleteReading(replacingReadingId);
                await addReading(user.id, { date: formatDateForApi(date), kwh: parseFloat(kwhValue), notes: notes.trim() || null }, photoUri);
                Alert.alert('Berhasil', 'Data lama berhasil diganti dengan data baru!', [
                    { text: 'OK', onPress: () => { resetForm(); onReplaceComplete?.(); router.replace('/(tabs)'); } }
                ]);
                return;
            }

            const existing = await checkReadingExists(user.id, date);
            if (existing) {
                setLoading(false);
                if (onDuplicateDate) {
                    const formData: ReadingInput = { date: formatDateForApi(date), kwh: parseFloat(kwhValue), notes: notes.trim() || null };
                    onDuplicateDate(existing, formData, photoUri);
                }
                return;
            }

            await addReading(user.id, { date: formatDateForApi(date), kwh: parseFloat(kwhValue), notes: notes.trim() || null }, photoUri);
            Alert.alert('Berhasil', 'Pembacaan meter berhasil disimpan!', [
                { text: 'OK', onPress: () => { resetForm(); router.replace('/(tabs)'); } }
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
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <GlassCard variant="reading">
                <Text className="text-lg font-semibold text-slate-800 mb-5">Catat Pembacaan Meter</Text>

                {/* Date Picker */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-800 mb-1.5">Tanggal</Text>
                    {Platform.OS === 'web' ? (
                        <View className="flex-row items-center gap-3 p-3.5 bg-white border border-border rounded-xl">
                            <Calendar size={20} color={colors.reading} />
                            <TextInput
                                value={date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChangeText={handleWebDateChange}
                                className="flex-1 text-base text-slate-800"
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                className="flex-row items-center gap-3 p-3.5 bg-white border border-border rounded-xl"
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={20} color={colors.reading} />
                                <Text className="text-base text-slate-800">{formatDate(date, 'EEEE, d MMMM yyyy')}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={maxDate}
                                    minimumDate={minDate}
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
                <PhotoCapture photoUri={photoUri} onPhotoChange={setPhotoUri} variant="reading" />

                {/* Submit Button */}
                <View className="mt-6">
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
            <GlassCard className="mt-4 bg-indigo-50 border-indigo-100">
                <Text className="text-sm font-semibold text-slate-800 mb-2">💡 Tips</Text>
                <Text className="text-[13px] text-slate-500 leading-5">
                    • Catat pembacaan meter secara rutin untuk tracking akurat{'\n'}
                    • Pastikan nilai kWh lebih kecil dari pembacaan terakhir{'\n'}
                    • Jika membeli token, gunakan mode "Top Up Token"
                </Text>
            </GlassCard>

            <View className="h-8" />
        </ScrollView>
    );
}
