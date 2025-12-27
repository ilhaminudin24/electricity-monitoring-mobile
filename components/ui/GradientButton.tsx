import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'reading' | 'topup' | 'danger';
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
    className?: string;
}

export function GradientButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    style,
    textStyle,
    icon,
    className = '',
}: GradientButtonProps) {
    const gradientColors = getGradientColors(variant);
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            className={`rounded-xl overflow-hidden shadow-md ${isDisabled ? 'opacity-70' : ''} ${className}`}
            style={style}
        >
            <LinearGradient
                colors={isDisabled ? ['#94A3B8', '#64748B'] : gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center py-4 px-6 gap-2"
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        {icon}
                        <Text
                            className="text-base font-semibold text-white"
                            style={textStyle}
                        >
                            {title}
                        </Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

function getGradientColors(variant: string): [string, string] {
    switch (variant) {
        case 'reading':
            return [colors.primary[500], colors.primary[600]];
        case 'topup':
            return [colors.accent[500], colors.accent[600]];
        case 'danger':
            return ['#EF4444', '#DC2626'];
        case 'primary':
        default:
            return [colors.primary[500], colors.primary[700]];
    }
}
