/**
 * HistoryFilters Component
 * Search, date range, and type filters for history list
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { Search } from 'lucide-react-native';

export type DateRangeFilter = '30d' | '12m' | 'all';
export type TypeFilter = 'all' | 'reading' | 'topup';

interface HistoryFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    dateRange: DateRangeFilter;
    onDateRangeChange: (range: DateRangeFilter) => void;
    typeFilter: TypeFilter;
    onTypeFilterChange: (type: TypeFilter) => void;
}

export function HistoryFilters({
    searchQuery,
    onSearchChange,
    dateRange,
    onDateRangeChange,
    typeFilter,
    onTypeFilterChange,
}: HistoryFiltersProps) {
    return (
        <View style={styles.container}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari tanggal, nilai, catatan..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Periode:</Text>
                <View style={styles.segmentedControl}>
                    {(['30d', '12m', 'all'] as DateRangeFilter[]).map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[
                                styles.segment,
                                dateRange === range && styles.segmentActive
                            ]}
                            onPress={() => onDateRangeChange(range)}
                        >
                            <Text style={[
                                styles.segmentText,
                                dateRange === range && styles.segmentTextActive
                            ]}>
                                {range === '30d' ? '30 Hari' : range === '12m' ? '12 Bulan' : 'Semua'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Type Filter */}
            <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Tipe:</Text>
                <View style={styles.segmentedControl}>
                    {(['all', 'reading', 'topup'] as TypeFilter[]).map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.segment,
                                typeFilter === type && styles.segmentActive
                            ]}
                            onPress={() => onTypeFilterChange(type)}
                        >
                            <Text style={[
                                styles.segmentText,
                                typeFilter === type && styles.segmentTextActive
                            ]}>
                                {type === 'all' ? 'Semua' : type === 'reading' ? 'Pembacaan' : 'Top Up'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    filterLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        minWidth: 60,
    },
    segmentedControl: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    segment: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
    },
    segmentActive: {
        backgroundColor: colors.primary[500],
    },
    segmentText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    segmentTextActive: {
        color: 'white',
    },
});
