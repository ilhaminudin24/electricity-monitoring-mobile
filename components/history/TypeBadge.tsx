/**
 * TypeBadge Component
 * Displays reading type: Reading (Blue) or TopUp (Yellow)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface TypeBadgeProps {
    type: 'reading' | 'topup';
}

export function TypeBadge({ type }: TypeBadgeProps) {
    const isTopUp = type === 'topup';

    return (
        <View style={[
            styles.badge,
            isTopUp ? styles.topupBadge : styles.readingBadge
        ]}>
            <Text style={[
                styles.text,
                isTopUp ? styles.topupText : styles.readingText
            ]}>
                {isTopUp ? 'Top Up' : 'Pembacaan'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    readingBadge: {
        backgroundColor: colors.primary[50],
    },
    topupBadge: {
        backgroundColor: colors.accent[50],
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
    readingText: {
        color: colors.primary[600],
    },
    topupText: {
        color: colors.accent[600],
    },
});
