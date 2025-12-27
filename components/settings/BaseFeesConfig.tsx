/**
 * BaseFeesConfig Component
 * Admin fee and tax percentage configuration
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface BaseFeesConfigProps {
    adminFee: string;
    taxPercent: string;
    onAdminFeeChange: (value: string) => void;
    onTaxPercentChange: (value: string) => void;
}

export function BaseFeesConfig({
    adminFee,
    taxPercent,
    onAdminFeeChange,
    onTaxPercentChange,
}: BaseFeesConfigProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Biaya & Pajak</Text>
            <Text style={styles.sectionDesc}>
                Pengaturan biaya admin dan pajak untuk kalkulasi token
            </Text>

            <View style={styles.fieldRow}>
                {/* Admin Fee */}
                <View style={styles.field}>
                    <Text style={styles.label}>Biaya Admin (Rp)</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.prefix}>Rp</Text>
                        <TextInput
                            style={styles.input}
                            value={adminFee}
                            onChangeText={onAdminFeeChange}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={colors.slate[400]}
                        />
                    </View>
                </View>

                {/* Tax Percentage */}
                <View style={styles.field}>
                    <Text style={styles.label}>Pajak (%)</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={taxPercent}
                            onChangeText={onTaxPercentChange}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={colors.slate[400]}
                        />
                        <Text style={styles.suffix}>%</Text>
                    </View>
                </View>
            </View>

            {/* Formula Display */}
            <View style={styles.formulaBox}>
                <Text style={styles.formulaLabel}>Formula Kalkulasi:</Text>
                <Text style={styles.formula}>
                    Token (kWh) = (Biaya - Admin - Pajak) / Tarif
                </Text>
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
    fieldRow: {
        flexDirection: 'row',
        gap: 12,
    },
    field: {
        flex: 1,
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
    suffix: {
        fontSize: 15,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    formulaBox: {
        marginTop: 16,
        backgroundColor: colors.primary[50],
        borderRadius: 8,
        padding: 12,
    },
    formulaLabel: {
        fontSize: 12,
        color: colors.primary[700],
        marginBottom: 4,
    },
    formula: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.primary[700],
        fontFamily: 'monospace',
    },
});
