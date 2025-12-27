/**
 * History Screen
 * Complete reading history with filters, pagination, CRUD operations, and recalculation support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Reading } from '@/types/reading';
import { getAllReadings, deleteReading, updateReading, bulkUpdateReadingsKwh, getReadingsAfterDate } from '@/lib/readingService';
import { HistoryFilters, DateRangeFilter, TypeFilter } from '@/components/history/HistoryFilters';
import { HistoryList } from '@/components/history/HistoryList';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { EditReadingModal } from '@/components/modals/EditReadingModal';
import { ImageViewerModal } from '@/components/modals/ImageViewerModal';
import { RecalculationHistoryPanel } from '@/components/modals/RecalculationHistoryPanel';
import { RecalculationModal } from '@/components/modals/RecalculationModal';
import { BackdatePreview, ValidationIssue, performCascadingRecalculation, TRIGGER_TYPES } from '@/shared/services/eventService';

const PAGE_SIZE = 10;

export default function HistoryScreen() {
    const { user } = useAuth();

    // Data state
    const [allReadings, setAllReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter state (not persisted)
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Recalculation state
    const [recalcModalVisible, setRecalcModalVisible] = useState(false);
    const [recalcLoading, setRecalcLoading] = useState(false);
    const [pendingRecalc, setPendingRecalc] = useState<{
        affectedEvents: BackdatePreview[];
        validationIssues: ValidationIssue[];
        kwhOffset: number;
        readingId: string;
        updates: Partial<Reading>;
    } | null>(null);

    // Fetch all readings
    const fetchReadings = useCallback(async () => {
        if (!user?.id) return;

        try {
            const readings = await getAllReadings(user.id);
            setAllReadings(readings);
        } catch (error) {
            console.error('Error fetching readings:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

    // Refresh handler
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchReadings();
    }, [fetchReadings]);

    // Apply filters (client-side)
    const filteredReadings = useMemo(() => {
        let filtered = [...allReadings];

        // Date range filter
        const now = new Date();
        if (dateRange === '30d') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(r => new Date(r.date) >= thirtyDaysAgo);
        } else if (dateRange === '12m') {
            const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(r => new Date(r.date) >= twelveMonthsAgo);
        }

        // Type filter
        if (typeFilter === 'reading') {
            filtered = filtered.filter(r => !r.token_cost || r.token_cost === 0);
        } else if (typeFilter === 'topup') {
            filtered = filtered.filter(r => r.token_cost && r.token_cost > 0);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r => {
                const dateStr = new Date(r.date).toLocaleDateString('id-ID').toLowerCase();
                const kwhStr = r.kwh_value.toString();
                const notesStr = (r.notes || '').toLowerCase();
                return dateStr.includes(query) || kwhStr.includes(query) || notesStr.includes(query);
            });
        }

        return filtered;
    }, [allReadings, dateRange, typeFilter, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredReadings.length / PAGE_SIZE);
    const paginatedReadings = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredReadings.slice(start, start + PAGE_SIZE);
    }, [filteredReadings, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, dateRange, typeFilter]);

    // Handlers
    const handleEdit = (reading: Reading) => {
        setSelectedReading(reading);
        setEditModalVisible(true);
    };

    const handleDelete = (reading: Reading) => {
        setSelectedReading(reading);
        setDeleteModalVisible(true);
    };

    const handleViewPhoto = (url: string) => {
        setSelectedImageUrl(url);
        setImageModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedReading) return;

        setIsDeleting(true);
        try {
            await deleteReading(selectedReading.id);
            setDeleteModalVisible(false);
            setSelectedReading(null);
            fetchReadings();

            if (Platform.OS === 'web') {
                alert('Data berhasil dihapus');
            } else {
                Alert.alert('Sukses', 'Data berhasil dihapus');
            }
        } catch (error) {
            console.error('Error deleting reading:', error);
            if (Platform.OS === 'web') {
                alert('Gagal menghapus data');
            } else {
                Alert.alert('Error', 'Gagal menghapus data');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditSuccess = () => {
        setEditModalVisible(false);
        setSelectedReading(null);
        fetchReadings();

        if (Platform.OS === 'web') {
            alert('Data berhasil diperbarui');
        } else {
            Alert.alert('Sukses', 'Data berhasil diperbarui');
        }
    };

    // Handle backdate detection from EditReadingModal
    const handleBackdateDetected = (
        affectedEvents: BackdatePreview[],
        validationIssues: ValidationIssue[],
        kwhOffset: number,
        readingId: string,
        updates: Partial<Reading>
    ) => {
        setPendingRecalc({
            affectedEvents,
            validationIssues,
            kwhOffset,
            readingId,
            updates,
        });
        setEditModalVisible(false);
        setRecalcModalVisible(true);
    };

    // Handle recalculation confirmation
    const handleConfirmRecalculation = async () => {
        if (!pendingRecalc || !user?.id) return;

        setRecalcLoading(true);
        try {
            const { readingId, updates, kwhOffset, affectedEvents } = pendingRecalc;

            // 1. Update the reading
            await updateReading(readingId, {
                date: updates.date,
                kwh: updates.kwh_value,
                token_cost: updates.token_cost,
                token_amount: updates.token_amount,
                notes: updates.notes,
            });

            // 2. Perform cascading update to future readings
            const futureReadings = await getReadingsAfterDate(user.id, new Date(updates.date!));
            if (futureReadings.length > 0) {
                // Build the updates array with calculated new kWh values
                const bulkUpdates = futureReadings.map(r => ({
                    id: r.id,
                    kwh_value: r.kwh_value + kwhOffset,
                }));
                await bulkUpdateReadingsKwh(bulkUpdates);
            }

            // 3. Record recalculation batch for rollback
            await performCascadingRecalculation(
                user.id,
                readingId,
                TRIGGER_TYPES.EDIT_TOPUP,
                affectedEvents,
                kwhOffset
            );

            setRecalcModalVisible(false);
            setPendingRecalc(null);
            fetchReadings();

            if (Platform.OS === 'web') {
                alert('Data berhasil diperbarui dengan recalculation');
            } else {
                Alert.alert('Sukses', 'Data berhasil diperbarui dengan recalculation');
            }
        } catch (error: any) {
            console.error('Error during recalculation:', error);
            if (Platform.OS === 'web') {
                alert('Gagal melakukan recalculation: ' + error.message);
            } else {
                Alert.alert('Error', 'Gagal melakukan recalculation: ' + error.message);
            }
        } finally {
            setRecalcLoading(false);
        }
    };

    // Convert BackdatePreview to Reading for RecalculationModal
    const affectedReadingsForModal: Reading[] = useMemo(() => {
        if (!pendingRecalc) return [];
        return pendingRecalc.affectedEvents.map(event => ({
            id: event.id,
            user_id: user?.id || '',
            date: event.event_date,
            kwh_value: event.current_kwh,
            token_cost: event.is_topup ? 0 : null,
            token_amount: null,
            notes: null,
            meter_photo_url: null,
            created_at: '',
        }));
    }, [pendingRecalc, user?.id]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Riwayat</Text>
                <Text style={styles.subtitle}>Lihat dan kelola riwayat pembacaan meter</Text>
            </View>

            {/* Recalculation Panel */}
            <RecalculationHistoryPanel />

            {/* Filters */}
            <HistoryFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
            />

            {/* List */}
            <HistoryList
                readings={paginatedReadings}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewPhoto={handleViewPhoto}
            />

            {/* Modals */}
            <DeleteConfirmModal
                visible={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />

            <EditReadingModal
                visible={editModalVisible}
                reading={selectedReading}
                onClose={() => setEditModalVisible(false)}
                onSuccess={handleEditSuccess}
                onBackdateDetected={handleBackdateDetected}
            />

            <ImageViewerModal
                visible={imageModalVisible}
                imageUrl={selectedImageUrl}
                onClose={() => setImageModalVisible(false)}
            />

            <RecalculationModal
                visible={recalcModalVisible}
                onClose={() => {
                    setRecalcModalVisible(false);
                    setPendingRecalc(null);
                }}
                onConfirm={handleConfirmRecalculation}
                loading={recalcLoading}
                affectedReadings={affectedReadingsForModal}
                kwhOffset={pendingRecalc?.kwhOffset || 0}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 4,
    },
});
