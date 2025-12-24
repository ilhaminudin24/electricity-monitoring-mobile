import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'reading' | 'topup';
}

export function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
    const borderColor = variant === 'reading'
        ? colors.reading
        : variant === 'topup'
            ? colors.topup
            : colors.border;

    return (
        <View style={[styles.card, { borderColor }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
});
