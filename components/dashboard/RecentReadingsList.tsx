import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronRight, Zap, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Reading, sortReadingsChronologically } from '@/shared/utils/analytics';

interface RecentReadingsListProps {
    readings: Reading[];
    onItemPress?: (reading: Reading) => void;
    loading?: boolean;
}

export function RecentReadingsList({ readings, onItemPress, loading }: RecentReadingsListProps) {
    // Get last 5 readings sorted by date (newest first)
    const recentReadings = sortReadingsChronologically(readings)
        .slice(-5)
        .reverse();

    const isTopUp = (reading: Reading) =>
        reading.token_cost !== null && reading.token_cost !== undefined && reading.token_cost > 0;

    const calculateConsumption = (reading: Reading, index: number) => {
        // For the most recent reading, we need the next one (which in original order is previous)
        const sortedByDate = sortReadingsChronologically(readings);
        const currentIndex = sortedByDate.findIndex(r => r.id === reading.id);

        if (currentIndex <= 0) return null;

        const prevReading = sortedByDate[currentIndex - 1];
        const consumption = prevReading.kwh_value - reading.kwh_value;

        return consumption > 0 ? consumption : null;
    };

    const renderItem = ({ item, index }: { item: Reading; index: number }) => {
        const topUp = isTopUp(item);
        const consumption = calculateConsumption(item, index);

        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() => onItemPress?.(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, topUp ? styles.iconTopUp : styles.iconReading]}>
                    {topUp ? (
                        <Zap size={16} color={colors.topup} />
                    ) : (
                        <TrendingDown size={16} color={colors.reading} />
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.row}>
                        <Text style={styles.date}>
                            {format(new Date(item.date), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                        </Text>
                        <View style={[styles.badge, topUp ? styles.badgeTopUp : styles.badgeReading]}>
                            <Text style={[styles.badgeText, topUp ? styles.badgeTextTopUp : styles.badgeTextReading]}>
                                {topUp ? 'Top Up' : 'Reading'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.kwhValue}>{item.kwh_value.toFixed(1)} kWh</Text>
                        {consumption !== null && !topUp && (
                            <Text style={styles.consumption}>-{consumption.toFixed(1)} kWh</Text>
                        )}
                        {topUp && item.token_amount && (
                            <Text style={styles.topUpAmount}>+{item.token_amount.toFixed(1)} kWh</Text>
                        )}
                    </View>
                </View>

                <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Catatan Terbaru</Text>
                <Text style={styles.subtitle}>5 pencatatan terakhir</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                </View>
            ) : recentReadings.length > 0 ? (
                <FlatList
                    data={recentReadings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada catatan. Mulai catat penggunaan di tab "Input".</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconReading: {
        backgroundColor: `${colors.reading}15`,
    },
    iconTopUp: {
        backgroundColor: `${colors.topup}15`,
    },
    content: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    date: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeReading: {
        backgroundColor: `${colors.reading}15`,
    },
    badgeTopUp: {
        backgroundColor: `${colors.topup}15`,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    badgeTextReading: {
        color: colors.reading,
    },
    badgeTextTopUp: {
        color: colors.topup,
    },
    kwhValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginTop: 4,
    },
    consumption: {
        fontSize: 13,
        color: colors.reading,
        fontWeight: '500',
    },
    topUpAmount: {
        fontSize: 13,
        color: colors.topup,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    loadingContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
    },
    emptyContainer: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
