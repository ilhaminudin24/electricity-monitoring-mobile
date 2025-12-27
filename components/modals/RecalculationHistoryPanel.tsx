import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { Clock, ChevronDown, ChevronUp, Undo2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import {
    getPendingRollbacks,
    rollbackRecalculation,
    RecalculationBatch,
    TRIGGER_TYPES,
} from '@/shared/services/eventService';

export function RecalculationHistoryPanel() {
    const { user } = useAuth();
    const [batches, setBatches] = useState<RecalculationBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [rollingBack, setRollingBack] = useState<string | null>(null);

    useEffect(() => {
        loadBatches();
    }, [user?.id]);

    const loadBatches = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await getPendingRollbacks(user.id);
            setBatches(data);
        } catch (error) {
            console.error('Failed to load rollback batches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (batch: RecalculationBatch) => {
        Alert.alert(
            'Batalkan Perubahan?',
            `Yakin ingin membatalkan perubahan pada ${batch.events_count} catatan?`,
            [
                { text: 'Tidak', style: 'cancel' },
                {
                    text: 'Ya, Batalkan',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRollingBack(batch.id);
                            await rollbackRecalculation(batch.id, 'User requested rollback', user!.id);
                            await loadBatches();
                            Alert.alert('Berhasil', 'Perubahan berhasil dibatalkan');
                        } catch (error: any) {
                            Alert.alert('Gagal', error.message || 'Gagal membatalkan perubahan');
                        } finally {
                            setRollingBack(null);
                        }
                    },
                },
            ]
        );
    };

    const getTriggerLabel = (type: string): string => {
        switch (type) {
            case TRIGGER_TYPES.BACKDATE_TOPUP:
                return 'Top-up Backdate';
            case TRIGGER_TYPES.EDIT_TOPUP:
                return 'Edit Top-up';
            case TRIGGER_TYPES.DELETE_TOPUP:
                return 'Hapus Top-up';
            default:
                return 'Koreksi Manual';
        }
    };

    const getTimeRemaining = (until: string): string => {
        const diff = new Date(until).getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `Sisa ${hours}j ${minutes}m`;
        if (minutes > 0) return `Sisa ${minutes} menit`;
        return 'Hampir habis';
    };

    const formatDateShort = (date: string): string => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Don't render if loading or no batches
    if (loading || batches.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Clock size={20} color="#F59E0B" />
                <Text style={styles.headerTitle}>Perubahan yang Dapat Dibatalkan</Text>
            </View>

            {batches.map((batch) => (
                <View key={batch.id} style={styles.batchCard}>
                    <TouchableOpacity
                        style={styles.batchHeader}
                        onPress={() => setExpandedId(expandedId === batch.id ? null : batch.id)}
                    >
                        <View style={styles.batchInfo}>
                            <Text style={styles.batchTitle}>
                                {getTriggerLabel(batch.trigger_type)}
                            </Text>
                            <Text style={styles.batchMeta}>
                                {batch.events_count} catatan • {getTimeRemaining(batch.can_rollback_until)}
                            </Text>
                        </View>
                        <View style={styles.batchActions}>
                            <TouchableOpacity
                                style={[
                                    styles.undoButton,
                                    rollingBack === batch.id && styles.undoButtonDisabled,
                                ]}
                                onPress={() => handleRollback(batch)}
                                disabled={rollingBack === batch.id}
                            >
                                <Undo2 size={14} color="#F59E0B" />
                                <Text style={styles.undoButtonText}>
                                    {rollingBack === batch.id ? '...' : 'Batalkan'}
                                </Text>
                            </TouchableOpacity>
                            {expandedId === batch.id ? (
                                <ChevronUp size={20} color={colors.textSecondary} />
                            ) : (
                                <ChevronDown size={20} color={colors.textSecondary} />
                            )}
                        </View>
                    </TouchableOpacity>

                    {expandedId === batch.id && (
                        <View style={styles.batchDetails}>
                            <Text style={styles.detailsTitle}>Detail Perubahan:</Text>
                            {(batch.affected_events as any[]).slice(0, 5).map((event, idx) => (
                                <View key={idx} style={styles.detailRow}>
                                    <Text style={styles.detailDate}>
                                        {formatDateShort(event.event_date)}
                                    </Text>
                                    <Text style={styles.detailChange}>
                                        {event.old_kwh.toFixed(1)} → {event.new_kwh.toFixed(1)} kWh
                                    </Text>
                                </View>
                            ))}
                            {batch.affected_events.length > 5 && (
                                <Text style={styles.moreText}>
                                    +{batch.affected_events.length - 5} catatan lainnya
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
    },
    batchCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },
    batchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    batchInfo: {
        flex: 1,
    },
    batchTitle: {
        fontWeight: '600',
        color: '#1F2937',
        fontSize: 14,
    },
    batchMeta: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    batchActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    undoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    undoButtonDisabled: {
        opacity: 0.5,
    },
    undoButtonText: {
        color: '#F59E0B',
        fontWeight: '500',
        fontSize: 12,
    },
    batchDetails: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        padding: 12,
        backgroundColor: '#F9FAFB',
    },
    detailsTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    detailDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    detailChange: {
        fontSize: 12,
        color: '#059669',
        fontFamily: 'monospace',
    },
    moreText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 4,
    },
});
