/**
 * BudgetConfig Component
 * Monthly budget and alert threshold configuration with preview
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@/constants/colors';
import { formatRupiah } from '@/shared/utils/rupiah';

interface BudgetConfigProps {
    monthlyBudget: string;
    alertThreshold: number;
    onMonthlyBudgetChange: (value: string) => void;
    onAlertThresholdChange: (value: number) => void;
}

export function BudgetConfig({
    monthlyBudget,
    alertThreshold,
    onMonthlyBudgetChange,
    onAlertThresholdChange,
}: BudgetConfigProps) {
    // Calculate preview values
    const budget = parseFloat(monthlyBudget) || 0;
    const dailyBudget = budget / 30;
    const weeklyBudget = dailyBudget * 7;
    const alertAmount = budget * (alertThreshold / 100);

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Pengaturan Anggaran</Text>
            <Text style={styles.sectionDesc}>
                Atur anggaran bulanan dan batas peringatan
            </Text>

            {/* Monthly Budget Input */}
            <View style={styles.field}>
                <Text style={styles.label}>Anggaran Bulanan</Text>
                <View style={styles.inputWrapper}>
                    <Text style={styles.prefix}>Rp</Text>
                    <TextInput
                        style={styles.input}
                        value={monthlyBudget}
                        onChangeText={onMonthlyBudgetChange}
                        keyboardType="number-pad"
                        placeholder="500000"
                        placeholderTextColor={colors.slate[400]}
                    />
                </View>
            </View>

            {/* Alert Threshold Slider */}
            <View style={styles.field}>
                <View style={styles.sliderHeader}>
                    <Text style={styles.label}>Batas Peringatan</Text>
                    <Text style={styles.thresholdValue}>{alertThreshold}%</Text>
                </View>
                {Platform.OS === 'web' ? (
                    <input
                        type="range"
                        min={50}
                        max={100}
                        value={alertThreshold}
                        onChange={(e) => onAlertThresholdChange(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                ) : (
                    <Slider
                        style={styles.slider}
                        minimumValue={50}
                        maximumValue={100}
                        step={5}
                        value={alertThreshold}
                        onValueChange={onAlertThresholdChange}
                        minimumTrackTintColor={colors.primary[500]}
                        maximumTrackTintColor={colors.slate[200]}
                        thumbTintColor={colors.primary[600]}
                    />
                )}
                <Text style={styles.sliderHint}>
                    Peringatan akan muncul saat pemakaian mencapai {alertThreshold}% dari anggaran
                </Text>
            </View>

            {/* Budget Preview Cards */}
            <View style={styles.previewRow}>
                <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Harian</Text>
                    <Text style={styles.previewValue}>{formatRupiah(dailyBudget)}</Text>
                </View>
                <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Mingguan</Text>
                    <Text style={styles.previewValue}>{formatRupiah(weeklyBudget)}</Text>
                </View>
                <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Bulanan</Text>
                    <Text style={styles.previewValue}>{formatRupiah(budget)}</Text>
                </View>
            </View>

            {/* Alert Amount */}
            <View style={styles.alertBox}>
                <Text style={styles.alertLabel}>💡 Peringatan akan aktif pada:</Text>
                <Text style={styles.alertValue}>{formatRupiah(alertAmount)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    sectionDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 16,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
    },
    prefix: {
        fontSize: 15,
        color: colors.textSecondary,
        marginRight: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    thresholdValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary[600],
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderHint: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    previewRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    previewCard: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    previewValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    alertBox: {
        backgroundColor: colors.accent[50],
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    alertLabel: {
        fontSize: 13,
        color: colors.accent[700],
    },
    alertValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.accent[700],
    },
});
