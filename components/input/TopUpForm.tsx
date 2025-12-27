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
import { Calendar, Zap, FileText, Save, TrendingUp, Wallet } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { PhotoCapture } from './PhotoCapture';
import { useAuth } from '@/contexts/AuthContext';
import { getLastReadingBeforeDate, addReading, updateReading, checkReadingExists, deleteReading, getReadingsAfterDate, bulkUpdateReadingsKwh } from '@/lib/readingService';
import {
    checkForBackdate,
    validateBackdateOperation,
    previewBackdateImpact,
    addEvent,
    performCascadingRecalculation,
    EVENT_TYPES,
    TRIGGER_TYPES,
    BackdatePreview,
    ValidationIssue,
} from '@/shared/services/eventService';
import { loadSettings } from '@/shared/utils/settings';
import { calculateTokenAmount } from '@/shared/utils/tariff';
import { formatDate, formatDateForApi } from '@/shared/utils/date';
import { formatRupiah, formatRupiahInput, parseRupiah, formatKwh } from '@/shared/utils/rupiah';
import { Reading, ReadingInput } from '@/types/reading';
import { router } from 'expo-router';

interface TopUpFormProps {
    onDuplicateDate?: (existingReading: Reading, formData?: ReadingInput, photoUri?: string | null) => void;
    onBackdateDetected?: (
        affectedEvents: BackdatePreview[],
        validationIssues: ValidationIssue[],
        kwhOffset: number,
        formData: ReadingInput,
        photoUri?: string | null
    ) => void;
    editingReading?: Reading | null;
    onEditComplete?: () => void;
    replacingReadingId?: string | null;
    onReplaceComplete?: () => void;
}

export function TopUpForm({
    onDuplicateDate,
    onBackdateDetected,
    editingReading,
    onEditComplete,
    replacingReadingId,
    onReplaceComplete,
}: TopUpFormProps) {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tokenCost, setTokenCost] = useState('');
    const [calculatedKwh, setCalculatedKwh] = useState<number | null>(null);
    const [newKwhValue, setNewKwhValue] = useState('');
    const [notes, setNotes] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastReading, setLastReading] = useState<Reading | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Date constraints: max = today, min = 30 days ago
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);

    useEffect(() => { loadSettings(); }, []);

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
        const calculate = async () => {
            const costNum = parseRupiah(tokenCost);
            if (costNum > 0) {
                const kwh = await calculateTokenAmount(costNum);
                setCalculatedKwh(kwh);
                if (kwh !== null) {
                    // lastReading bisa null untuk user baru, gunakan 0 sebagai default
                    const previousKwh = lastReading?.kwh_value ?? 0;
                    const newReading = previousKwh + kwh;
                    setNewKwhValue(newReading.toFixed(2));
                }
            } else {
                setCalculatedKwh(null);
                setNewKwhValue('');
            }
        };
        calculate();
    }, [tokenCost, lastReading]);

    useEffect(() => {
        if (editingReading) {
            setDate(new Date(editingReading.date));
            if (editingReading.token_cost) {
                setTokenCost(formatRupiahInput(editingReading.token_cost));
            }
            setNewKwhValue(String(editingReading.kwh_value));
            setNotes(editingReading.notes || '');
        }
    }, [editingReading]);

    const resetForm = () => {
        setDate(new Date());
        setTokenCost('');
        setCalculatedKwh(null);
        setNewKwhValue('');
        setNotes('');
        setPhotoUri(null);
        setError(null);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
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

    const handleTokenCostChange = (text: string) => {
        const cleaned = text.replace(/[^\d]/g, '');
        if (cleaned) {
            setTokenCost(formatRupiahInput(parseInt(cleaned, 10)));
        } else {
            setTokenCost('');
        }
    };

    const validateForm = (): boolean => {
        const costNum = parseRupiah(tokenCost);
        if (costNum <= 0) { setError('Masukkan nominal token'); return false; }
        if (!newKwhValue.trim()) { setError('Masukkan nilai kWh baru'); return false; }
        const kwhNum = parseFloat(newKwhValue);
        if (isNaN(kwhNum) || kwhNum < 0) { setError('Nilai kWh tidak valid'); return false; }
        if (lastReading && kwhNum < lastReading.kwh_value) {
            setError('Nilai kWh setelah top-up harus lebih tinggi dari pembacaan terakhir');
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
            const costNum = parseRupiah(tokenCost);

            if (editingReading) {
                await updateReading(editingReading.id, {
                    date: formatDateForApi(date), kwh: parseFloat(newKwhValue),
                    token_cost: costNum, token_amount: calculatedKwh, notes: notes.trim() || null,
                });
                Alert.alert('Berhasil', 'Top-up token berhasil diupdate!', [
                    { text: 'OK', onPress: () => { resetForm(); onEditComplete?.(); router.replace('/(tabs)'); } }
                ]);
                return;
            }

            if (replacingReadingId) {
                await deleteReading(replacingReadingId);
                await addReading(user.id, {
                    date: formatDateForApi(date), kwh: parseFloat(newKwhValue),
                    token_cost: costNum, token_amount: calculatedKwh, notes: notes.trim() || null,
                }, photoUri);
                Alert.alert('Berhasil', 'Data lama berhasil diganti dengan data baru!', [
                    { text: 'OK', onPress: () => { resetForm(); onReplaceComplete?.(); router.replace('/(tabs)'); } }
                ]);
                return;
            }

            const existing = await checkReadingExists(user.id, date);
            if (existing) {
                setLoading(false);
                if (onDuplicateDate) {
                    const formData: ReadingInput = {
                        date: formatDateForApi(date), kwh: parseFloat(newKwhValue),
                        token_cost: costNum, token_amount: calculatedKwh, notes: notes.trim() || null,
                    };
                    onDuplicateDate(existing, formData, photoUri);
                }
                return;
            }

            // Check for backdate recalculation using Event Sourcing
            const purchasedKwh = calculatedKwh || parseFloat(newKwhValue) - (lastReading?.kwh_value || 0);
            const backdateCheck = await checkForBackdate(user.id, formatDateForApi(date));

            if (backdateCheck.isBackdate && onBackdateDetected) {
                // Validate if backdate would cause issues
                const validation = await validateBackdateOperation(
                    user.id,
                    formatDateForApi(date),
                    purchasedKwh
                );

                // Preview the impact
                const preview = await previewBackdateImpact(
                    user.id,
                    formatDateForApi(date),
                    purchasedKwh
                );

                // DO NOT save yet - wait for user confirmation
                setLoading(false);
                const formData: ReadingInput = {
                    date: formatDateForApi(date),
                    kwh: parseFloat(newKwhValue),
                    token_cost: costNum,
                    token_amount: calculatedKwh,
                    notes: notes.trim() || null,
                };
                onBackdateDetected(preview, validation.issues, purchasedKwh, formData, photoUri);
                return;
            }

            // No backdate detected - safe to save directly
            await addReading(user.id, {
                date: formatDateForApi(date), kwh: parseFloat(newKwhValue),
                token_cost: costNum, token_amount: calculatedKwh, notes: notes.trim() || null,
            }, photoUri);

            Alert.alert('Berhasil', 'Top-up token berhasil disimpan!', [
                { text: 'OK', onPress: () => { resetForm(); router.replace('/(tabs)'); } }
            ]);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan top-up');
        } finally {
            setLoading(false);
        }
    };

    const costNum = parseRupiah(tokenCost);

    return (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <GlassCard variant="topup">
                <Text className="text-lg font-semibold text-slate-800 mb-5">Top Up Token Listrik</Text>

                {/* Date Picker */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-800 mb-1.5">Tanggal Top Up</Text>
                    {Platform.OS === 'web' ? (
                        <View className="flex-row items-center gap-3 p-3.5 bg-white border border-topup/30 rounded-xl">
                            <Calendar size={20} color={colors.topup} />
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
                                className="flex-row items-center gap-3 p-3.5 bg-white border border-topup/30 rounded-xl"
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={20} color={colors.topup} />
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

                {/* Token Cost Input */}
                <Input
                    label="Nominal Token (Rp)"
                    placeholder="Contoh: 50.000"
                    value={tokenCost}
                    onChangeText={handleTokenCostChange}
                    keyboardType="number-pad"
                    variant="topup"
                    leftIcon={<Wallet size={20} color={colors.topup} />}
                />

                {/* Smart Pre-fill Preview */}
                {calculatedKwh !== null && costNum > 0 && (
                    <GlassCard variant="topup" className="mb-4 bg-amber-50">
                        <View className="flex-row items-center gap-2 mb-3">
                            <TrendingUp size={20} color={colors.topup} />
                            <Text className="text-sm font-semibold text-topup">Smart Pre-fill</Text>
                        </View>

                        <View>
                            <View className="flex-row justify-between items-center py-1.5">
                                <Text className="text-[13px] text-slate-500">Nominal Token</Text>
                                <Text className="text-sm font-semibold text-slate-800">{formatRupiah(costNum)}</Text>
                            </View>
                            <View className="flex-row justify-between items-center py-1.5">
                                <Text className="text-[13px] text-slate-500">Estimasi kWh</Text>
                                <Text className="text-sm font-semibold text-topup">+{formatKwh(calculatedKwh, 2)}</Text>
                            </View>
                            <View className="h-px bg-border my-2" />
                            <View className="flex-row justify-between items-center py-1.5">
                                <Text className="text-[13px] text-slate-500">Meter Sebelumnya</Text>
                                <Text className="text-sm font-semibold text-slate-800">
                                    {lastReading ? formatKwh(lastReading.kwh_value, 1) : '-'}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center py-1.5">
                                <Text className="text-[13px] text-slate-500">Meter Baru (Est.)</Text>
                                <Text className="text-sm font-bold text-success">
                                    {formatKwh(parseFloat(newKwhValue) || 0, 2)}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                )}

                {/* New kWh Input */}
                <Input
                    label="Posisi Meter Baru (kWh)"
                    placeholder="Nilai kWh setelah top-up"
                    value={newKwhValue}
                    onChangeText={setNewKwhValue}
                    keyboardType="decimal-pad"
                    variant="topup"
                    leftIcon={<Zap size={20} color={colors.topup} />}
                    error={error || undefined}
                />

                {/* Notes */}
                <Input
                    label="Catatan (Opsional)"
                    placeholder="Contoh: Token via Tokopedia"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={2}
                    variant="topup"
                    leftIcon={<FileText size={20} color={colors.textSecondary} />}
                />

                {/* Photo Capture */}
                <PhotoCapture photoUri={photoUri} onPhotoChange={setPhotoUri} variant="topup" />

                {/* Submit Button */}
                <View className="mt-6">
                    <GradientButton
                        title="Simpan Top Up"
                        onPress={handleSubmit}
                        loading={loading}
                        variant="topup"
                        icon={<Save size={20} color="#FFFFFF" />}
                    />
                </View>
            </GlassCard>

            {/* Info Card */}
            <GlassCard className="mt-4 bg-amber-50 border-amber-100">
                <Text className="text-sm font-semibold text-slate-800 mb-2">⚡ Smart Pre-fill</Text>
                <Text className="text-[13px] text-slate-500 leading-5">
                    Sistem akan otomatis menghitung estimasi kWh berdasarkan nominal token dan tarif PLN Anda.
                    Posisi meter baru akan di-prefill otomatis.
                </Text>
            </GlassCard>

            <View className="h-8" />
        </ScrollView>
    );
}
