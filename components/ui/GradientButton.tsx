import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
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
}: GradientButtonProps) {
    const gradientColors = getGradientColors(variant);
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[styles.button, isDisabled && styles.buttonDisabled, style]}
        >
            <LinearGradient
                colors={isDisabled ? ['#94A3B8', '#64748B'] : gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        {icon}
                        <Text style={[styles.text, textStyle]}>{title}</Text>
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

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
