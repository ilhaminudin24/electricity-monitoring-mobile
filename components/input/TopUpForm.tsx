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
import { Calendar, Zap, FileText, Save, TrendingUp, Wallet } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { PhotoCapture } from './PhotoCapture';
import { useAuth } from '@/contexts/AuthContext';
import { getLastReading, getLastReadingBeforeDate, addReading, updateReading, checkReadingExists, deleteReading } from '@/lib/readingService';
import { getSettings, loadSettings } from '@/shared/utils/settings';
import { calculateTokenAmount } from '@/shared/utils/tariff';
import { formatDate, formatDateForApi } from '@/shared/utils/date';
import { formatRupiah, formatRupiahInput, parseRupiah, formatKwh } from '@/shared/utils/rupiah';
import { Reading, ReadingInput } from '@/types/reading';
import { router } from 'expo-router';

interface TopUpFormProps {
    onDuplicateDate?: (existingReading: Reading, formData?: ReadingInput, photoUri?: string | null) => void;
    editingReading?: Reading | null;
    onEditComplete?: () => void;
    replacingReadingId?: string | null;
    onReplaceComplete?: () => void;
}

export function TopUpForm({
    onDuplicateDate,
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

    // Calculate kWh when token cost changes
    useEffect(() => {
        const calculate = async () => {
            const costNum = parseRupiah(tokenCost);
            if (costNum > 0) {
                const kwh = await calculateTokenAmount(costNum);
                setCalculatedKwh(kwh);

                // Smart pre-fill: lastReading + calculatedKwh
                if (kwh && lastReading) {
                    const newReading = lastReading.kwh_value + kwh;
                    setNewKwhValue(newReading.toFixed(2));
                }
            } else {
                setCalculatedKwh(null);
                setNewKwhValue('');
            }
        };
        calculate();
    }, [tokenCost, lastReading]);

    // Handle editing mode - pre-fill form with existing data
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

    // Reset form to initial state
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

    const handleTokenCostChange = (text: string) => {
        // Allow only numbers
        const cleaned = text.replace(/[^\d]/g, '');
        if (cleaned) {
            setTokenCost(formatRupiahInput(parseInt(cleaned, 10)));
        } else {
            setTokenCost('');
        }
    };

    const validateForm = (): boolean => {
        const costNum = parseRupiah(tokenCost);
        if (costNum <= 0) {
            setError('Masukkan nominal token');
            return false;
        }

        if (!newKwhValue.trim()) {
            setError('Masukkan nilai kWh baru');
            return false;
        }

        const kwhNum = parseFloat(newKwhValue);
        if (isNaN(kwhNum) || kwhNum < 0) {
            setError('Nilai kWh tidak valid');
            return false;
        }

        // Check if new reading is less than last (should be higher after top-up)
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

            // If we're editing an existing reading
            if (editingReading) {
                await updateReading(editingReading.id, {
                    date: formatDateForApi(date),
                    kwh: parseFloat(newKwhValue),
                    token_cost: costNum,
                    token_amount: calculatedKwh,
                    notes: notes.trim() || null,
                });

                Alert.alert('Berhasil', 'Top-up token berhasil diupdate!', [
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
                        kwh: parseFloat(newKwhValue),
                        token_cost: costNum,
                        token_amount: calculatedKwh,
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
                        kwh: parseFloat(newKwhValue),
                        token_cost: costNum,
                        token_amount: calculatedKwh,
                        notes: notes.trim() || null,
                    };
                    onDuplicateDate(existing, formData, photoUri);
                }
                return;
            }

            // Add reading with token info
            await addReading(
                user.id,
                {
                    date: formatDateForApi(date),
                    kwh: parseFloat(newKwhValue),
                    token_cost: costNum,
                    token_amount: calculatedKwh,
                    notes: notes.trim() || null,
                },
                photoUri
            );

            Alert.alert('Berhasil', 'Top-up token berhasil disimpan!', [
                {
                    text: 'OK', onPress: () => {
                        resetForm();
                        router.replace('/(tabs)');
                    }
                }
            ]);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan top-up');
        } finally {
            setLoading(false);
        }
    };

    const costNum = parseRupiah(tokenCost);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <GlassCard variant="topup">
                <Text style={styles.cardTitle}>Top Up Token Listrik</Text>

                {/* Date Picker */}
                <View style={styles.dateContainer}>
                    <Text style={styles.label}>Tanggal Top Up</Text>
                    {Platform.OS === 'web' ? (
                        <View style={[styles.dateButton, { borderColor: colors.topup + '50' }]}>
                            <Calendar size={20} color={colors.topup} />
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
                                style={[styles.dateButton, { borderColor: colors.topup + '50' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={20} color={colors.topup} />
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
                    <GlassCard variant="topup" style={styles.previewCard}>
                        <View style={styles.previewHeader}>
                            <TrendingUp size={20} color={colors.topup} />
                            <Text style={styles.previewTitle}>Smart Pre-fill</Text>
                        </View>

                        <View style={styles.previewContent}>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Nominal Token</Text>
                                <Text style={styles.previewValue}>{formatRupiah(costNum)}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Estimasi kWh</Text>
                                <Text style={[styles.previewValue, { color: colors.topup }]}>
                                    +{formatKwh(calculatedKwh, 2)}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Meter Sebelumnya</Text>
                                <Text style={styles.previewValue}>
                                    {lastReading ? formatKwh(lastReading.kwh_value, 1) : '-'}
                                </Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Meter Baru (Est.)</Text>
                                <Text style={[styles.previewValue, { color: colors.success, fontWeight: '700' }]}>
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
                <PhotoCapture
                    photoUri={photoUri}
                    onPhotoChange={setPhotoUri}
                    variant="topup"
                />

                {/* Submit Button */}
                <View style={styles.submitContainer}>
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
            <GlassCard style={styles.infoCard}>
                <Text style={styles.infoTitle}>⚡ Smart Pre-fill</Text>
                <Text style={styles.infoText}>
                    Sistem akan otomatis menghitung estimasi kWh berdasarkan nominal token dan tarif PLN Anda.
                    Posisi meter baru akan di-prefill otomatis.
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
    previewCard: {
        marginBottom: 16,
        backgroundColor: '#FFFBEB',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.topup,
    },
    previewContent: {},
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    previewLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    previewValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 8,
    },
    submitContainer: {
        marginTop: 24,
    },
    infoCard: {
        marginTop: 16,
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
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
