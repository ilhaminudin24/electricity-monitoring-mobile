import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

type FilterType = 'day' | 'week' | 'month';

interface GlobalFilterBarProps {
    filter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

export function GlobalFilterBar({ filter, onFilterChange }: GlobalFilterBarProps) {
    const filters: { key: FilterType; label: string }[] = [
        { key: 'day', label: 'Hari' },
        { key: 'week', label: 'Minggu' },
        { key: 'month', label: 'Bulan' },
    ];

    return (
        <View style={styles.container}>
            {filters.map(({ key, label }) => (
                <TouchableOpacity
                    key={key}
                    style={[
                        styles.filterButton,
                        filter === key && styles.filterButtonActive,
                    ]}
                    onPress={() => onFilterChange(key)}
                >
                    <Text
                        style={[
                            styles.filterText,
                            filter === key && styles.filterTextActive,
                        ]}
                    >
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: colors.reading,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
