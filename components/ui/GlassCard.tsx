import React from 'react';
import { View, ViewStyle } from 'react-native';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    className?: string;
    variant?: 'default' | 'reading' | 'topup';
}

export function GlassCard({ children, style, className = '', variant = 'default' }: GlassCardProps) {
    const variantClasses = {
        default: 'border-border',
        reading: 'border-reading',
        topup: 'border-topup',
    };

    return (
        <View
            className={`bg-surface rounded-2xl border p-4 shadow-sm ${variantClasses[variant]} ${className}`}
            style={style}
        >
            {children}
        </View>
    );
}
