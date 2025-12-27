/**
 * ReadingItem Component
 * Card-style item for history list displaying reading details
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { TypeBadge } from './TypeBadge';
import { Reading } from '@/types/reading';
import { formatDate, formatTime } from '@/shared/utils/date';
import { formatRupiah } from '@/shared/utils/rupiah';
import { Pencil, Trash2, Image as ImageIcon } from 'lucide-react-native';

interface ReadingItemProps {
    reading: Reading;
    previousReading?: Reading | null;
    onEdit: (reading: Reading) => void;
    onDelete: (reading: Reading) => void;
    onViewPhoto?: (url: string) => void;
}

export function ReadingItem({
    reading,
    previousReading,
    onEdit,
    onDelete,
    onViewPhoto,
}: ReadingItemProps) {
    const isTopUp = reading.token_cost && reading.token_cost > 0;
    const type = isTopUp ? 'topup' : 'reading';

    // Calculate consumption (difference from previous reading)
    // For reading mode: previous - current (consumption decreases meter)
    // For topup mode: shows token amount added
    const consumption = isTopUp
        ? reading.token_amount ?? 0
        : previousReading
            ? previousReading.kwh_value - reading.kwh_value
            : 0;

    const readingDate = new Date(reading.date);

    return (
        <View style={styles.container}>
            {/* Header Row: Date + Badge */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.date}>{formatDate(readingDate)}</Text>
                    <Text style={styles.time}>{formatTime(readingDate)}</Text>
                </View>
                <TypeBadge type={type} />
            </View>

            {/* Main Content */}
            <View style={styles.contentRow}>
                {/* Meter Value */}
                <View style={styles.mainValue}>
                    <Text style={styles.label}>Meter</Text>
                    <Text style={styles.kwhValue}>{reading.kwh_value.toFixed(2)} kWh</Text>
                </View>

                {/* Consumption / Token Amount */}
                <View style={styles.secondaryValue}>
                    <Text style={styles.label}>
                        {isTopUp ? 'Token' : 'Pemakaian'}
                    </Text>
                    <Text style={[
                        styles.consumptionValue,
                        isTopUp ? styles.topupValue : styles.readingValue
                    ]}>
                        {isTopUp ? '+' : '-'}{consumption.toFixed(2)} kWh
                    </Text>
                </View>

                {/* Cost (for TopUp only) */}
                {isTopUp && reading.token_cost && (
                    <View style={styles.costValue}>
                        <Text style={styles.label}>Biaya</Text>
                        <Text style={styles.rupiah}>{formatRupiah(reading.token_cost)}</Text>
                    </View>
                )}
            </View>

            {/* Notes */}
            {reading.notes && (
                <Text style={styles.notes} numberOfLines={2}>
                    {reading.notes}
                </Text>
            )}

            {/* Action Row */}
            <View style={styles.actionRow}>
                {/* Photo indicator */}
                {reading.meter_photo_url && (
                    <TouchableOpacity
                        style={styles.photoButton}
                        onPress={() => onViewPhoto?.(reading.meter_photo_url!)}
                    >
                        <ImageIcon size={16} color={colors.primary[500]} />
                        <Text style={styles.photoText}>Lihat Foto</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.actionSpacer} />

                {/* Edit & Delete */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(reading)}
                >
                    <Pencil size={16} color={colors.primary[500]} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onDelete(reading)}
                >
                    <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    date: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    time: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    contentRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    mainValue: {
        flex: 1,
    },
    secondaryValue: {
        flex: 1,
    },
    costValue: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    kwhValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    consumptionValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    readingValue: {
        color: colors.primary[600],
    },
    topupValue: {
        color: colors.secondary[600],
    },
    rupiah: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    notes: {
        fontSize: 13,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
    },
    photoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    photoText: {
        fontSize: 13,
        color: colors.primary[500],
    },
    actionSpacer: {
        flex: 1,
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
});
