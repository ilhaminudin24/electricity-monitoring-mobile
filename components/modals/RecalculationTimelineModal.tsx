import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { AlertTriangle, XCircle, ArrowRight, Check, X, Clock, CheckCircle, Zap, Gauge } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { GradientButton } from '@/components/ui/GradientButton';
import { formatDate } from '@/shared/utils/date';
import { formatKwh, formatRupiah } from '@/shared/utils/rupiah';
import type { BackdatePreview, ValidationIssue } from '@/shared/services/eventService';

interface RecalculationTimelineModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    affectedEvents: BackdatePreview[];
    validationIssues: ValidationIssue[];
    newTopupKwh: number;
    newTopupDate: string;
    tokenCost: number;
}

export function RecalculationTimelineModal({
    visible,
    onClose,
    onConfirm,
    loading = false,
    affectedEvents,
    validationIssues,
    newTopupKwh,
    newTopupDate,
    tokenCost,
}: RecalculationTimelineModalProps) {
    // Don't render anything if not visible
    if (!visible) return null;

    const hasBlockingIssues = validationIssues.some((i) => i.severity === 'BLOCK');
    const topupCount = affectedEvents.filter((e) => e.is_topup).length;
    const readingCount = affectedEvents.filter((e) => !e.is_topup).length;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            {/* Close Button */}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {/* Header Icon */}
                            <View style={styles.headerIcon}>
                                {hasBlockingIssues ? (
                                    <XCircle size={48} color="#DC2626" />
                                ) : (
                                    <AlertTriangle size={48} color={colors.warning} />
                                )}
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>
                                {hasBlockingIssues
                                    ? 'Operasi Tidak Dapat Dilakukan'
                                    : 'Penyesuaian Data Diperlukan'}
                            </Text>

                            {/* Subtitle */}
                            <Text style={styles.subtitle}>
                                Anda menambahkan isi ulang untuk tanggal{' '}
                                <Text style={styles.subtitleBold}>
                                    {formatDate(newTopupDate, 'd MMMM yyyy')}
                                </Text>
                            </Text>

                            <ScrollView
                                style={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Validation Errors */}
                                {hasBlockingIssues && (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorTitle}>
                                            Data akan menjadi tidak valid:
                                        </Text>
                                        {validationIssues.map((issue, idx) => (
                                            <Text key={idx} style={styles.errorItem}>
                                                • {issue.message}
                                            </Text>
                                        ))}
                                    </View>
                                )}

                                {/* New Top-up Summary */}
                                {!hasBlockingIssues && (
                                    <View style={styles.summaryBox}>
                                        <Text style={styles.summaryTitle}>Top-up Baru</Text>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Tanggal:</Text>
                                            <Text style={styles.summaryValue}>
                                                {formatDate(newTopupDate, 'd MMM yyyy')}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>Nominal:</Text>
                                            <Text style={styles.summaryValue}>
                                                {formatRupiah(tokenCost)}
                                            </Text>
                                        </View>
                                        <View style={styles.summaryRow}>
                                            <Text style={styles.summaryLabel}>kWh Didapat:</Text>
                                            <Text style={[styles.summaryValue, styles.greenText]}>
                                                +{formatKwh(newTopupKwh, 2)}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Affected Count with Badges */}
                                {!hasBlockingIssues && affectedEvents.length > 0 && (
                                    <View style={styles.affectedBox}>
                                        <Text style={styles.affectedTitle}>
                                            {affectedEvents.length} Catatan Terpengaruh
                                        </Text>
                                        <View style={styles.badgeRow}>
                                            {readingCount > 0 && (
                                                <View style={styles.badgeBlue}>
                                                    <Gauge size={14} color="#3B82F6" />
                                                    <Text style={styles.badgeTextBlue}>
                                                        {readingCount} Pembacaan
                                                    </Text>
                                                </View>
                                            )}
                                            {topupCount > 0 && (
                                                <View style={styles.badgeYellow}>
                                                    <Zap size={14} color="#F59E0B" />
                                                    <Text style={styles.badgeTextYellow}>
                                                        {topupCount} Top-up
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}

                                {/* Timeline Table */}
                                {!hasBlockingIssues && affectedEvents.length > 0 && (
                                    <View style={styles.timelineContainer}>
                                        <View style={styles.timelineHeader}>
                                            <Text style={[styles.colDate, styles.headerText]}>Tanggal</Text>
                                            <Text style={[styles.colType, styles.headerText]}>Tipe</Text>
                                            <Text style={[styles.colBefore, styles.headerText]}>Sebelum</Text>
                                            <Text style={[styles.colAfter, styles.headerText]}>Sesudah</Text>
                                        </View>
                                        {affectedEvents.slice(0, 5).map((event) => (
                                            <View key={event.id} style={styles.timelineRow}>
                                                <Text style={styles.colDate}>
                                                    {formatDate(event.event_date, 'd MMM')}
                                                </Text>
                                                <View style={styles.colType}>
                                                    {event.is_topup ? (
                                                        <View style={styles.typeBadgeYellow}>
                                                            <Text style={styles.typeBadgeTextYellow}>⚡ Top-up</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.typeBadgeBlue}>
                                                            <Text style={styles.typeBadgeTextBlue}>📊 Reading</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.colBefore}>
                                                    {event.current_kwh.toFixed(1)}
                                                </Text>
                                                <Text style={[styles.colAfter, styles.greenText]}>
                                                    {event.new_kwh.toFixed(1)}
                                                </Text>
                                            </View>
                                        ))}
                                        {affectedEvents.length > 5 && (
                                            <Text style={styles.moreText}>
                                                +{affectedEvents.length - 5} catatan lainnya
                                            </Text>
                                        )}
                                    </View>
                                )}

                                {/* 24-Hour Undo Notice */}
                                {!hasBlockingIssues && (
                                    <View style={styles.undoNotice}>
                                        <Clock size={16} color="#3B82F6" />
                                        <Text style={styles.undoText}>
                                            Perubahan dapat dibatalkan dalam 24 jam
                                        </Text>
                                    </View>
                                )}

                                {/* Consumption Unchanged Note */}
                                {!hasBlockingIssues && (
                                    <View style={styles.consumptionNote}>
                                        <CheckCircle size={16} color="#10B981" />
                                        <Text style={styles.consumptionText}>
                                            Konsumsi harian Anda tetap sama
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Action Buttons */}
                            <View style={styles.buttonContainer}>
                                {!hasBlockingIssues && (
                                    <GradientButton
                                        title={loading ? 'Memproses...' : 'Lanjutkan & Update Semua'}
                                        onPress={onConfirm}
                                        variant="topup"
                                        loading={loading}
                                        icon={<Check size={18} color="#FFFFFF" />}
                                    />
                                )}
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}
                                    disabled={loading}
                                >
                                    <Text style={styles.cancelButtonText}>Batal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        maxHeight: '85%',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 8,
        zIndex: 10,
    },
    headerIcon: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitleBold: {
        fontWeight: '600',
        color: '#1F2937',
    },
    scrollContent: {
        maxHeight: 300,
    },
    errorBox: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorTitle: {
        color: '#DC2626',
        fontWeight: '600',
        marginBottom: 8,
    },
    errorItem: {
        color: '#B91C1C',
        fontSize: 14,
        lineHeight: 20,
    },
    summaryBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    summaryTitle: {
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: {
        color: '#6B7280',
        fontSize: 14,
    },
    summaryValue: {
        fontWeight: '500',
        color: '#1F2937',
        fontSize: 14,
    },
    greenText: {
        color: '#10B981',
    },
    affectedBox: {
        marginBottom: 16,
    },
    affectedTitle: {
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badgeBlue: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    badgeTextBlue: {
        color: '#3B82F6',
        fontSize: 12,
        fontWeight: '500',
    },
    badgeYellow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    badgeTextYellow: {
        color: '#F59E0B',
        fontSize: 12,
        fontWeight: '500',
    },
    timelineContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    timelineHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
        marginBottom: 8,
    },
    headerText: {
        fontWeight: '600',
        color: '#6B7280',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    timelineRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    colDate: {
        flex: 2,
        fontSize: 12,
        color: '#6B7280',
    },
    colType: {
        flex: 2,
    },
    colBefore: {
        flex: 1.5,
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right',
    },
    colAfter: {
        flex: 1.5,
        fontSize: 12,
        textAlign: 'right',
        fontWeight: '600',
    },
    typeBadgeYellow: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    typeBadgeTextYellow: {
        fontSize: 10,
        color: '#92400E',
    },
    typeBadgeBlue: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    typeBadgeTextBlue: {
        fontSize: 10,
        color: '#1E40AF',
    },
    moreText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    undoNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    undoText: {
        color: '#3B82F6',
        fontSize: 13,
        flex: 1,
    },
    consumptionNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    consumptionText: {
        color: '#10B981',
        fontSize: 13,
        flex: 1,
    },
    buttonContainer: {
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
    },
    cancelButtonText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 16,
    },
});
