/**
 * HistoryList Component
 * FlatList with pagination for reading history
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '@/constants/colors';
import { Reading } from '@/types/reading';
import { ReadingItem } from './ReadingItem';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface HistoryListProps {
    readings: Reading[];
    isLoading: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (reading: Reading) => void;
    onDelete: (reading: Reading) => void;
    onViewPhoto: (url: string) => void;
}

export function HistoryList({
    readings,
    isLoading,
    isRefreshing,
    onRefresh,
    currentPage,
    totalPages,
    onPageChange,
    onEdit,
    onDelete,
    onViewPhoto,
}: HistoryListProps) {
    // Create a map of previous readings for consumption calculation
    const getPreviousReading = (index: number): Reading | null => {
        if (index < readings.length - 1) {
            return readings[index + 1]; // Next in array is previous chronologically (sorted desc)
        }
        return null;
    };

    const renderItem = ({ item, index }: { item: Reading; index: number }) => (
        <ReadingItem
            reading={item}
            previousReading={getPreviousReading(index)}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewPhoto={onViewPhoto}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
            <Text style={styles.emptyText}>
                Mulai catat pembacaan meter Anda untuk melihat riwayat di sini
            </Text>
        </View>
    );

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <View style={styles.pagination}>
                <TouchableOpacity
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={20} color={currentPage === 1 ? colors.slate[300] : colors.primary[500]} />
                </TouchableOpacity>

                <Text style={styles.pageInfo}>
                    Halaman {currentPage} dari {totalPages}
                </Text>

                <TouchableOpacity
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight size={20} color={currentPage === totalPages ? colors.slate[300] : colors.primary[500]} />
                </TouchableOpacity>
            </View>
        );
    };

    if (isLoading && readings.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Memuat riwayat...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={readings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderPagination}
                contentContainerStyle={readings.length === 0 ? styles.emptyList : styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary[500]]}
                        tintColor={colors.primary[500]}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        paddingTop: 8,
        paddingBottom: 24,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 48,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    pageButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pageButtonDisabled: {
        opacity: 0.5,
    },
    pageInfo: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});
