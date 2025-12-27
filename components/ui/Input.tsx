import React from 'react';
import {
    TextInput,
    View,
    Text,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { colors } from '@/constants/colors';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    variant?: 'default' | 'reading' | 'topup';
    className?: string;
}

export function Input({
    label,
    error,
    containerStyle,
    leftIcon,
    rightIcon,
    variant = 'default',
    className = '',
    style,
    ...props
}: InputProps) {
    const focusColor = variant === 'reading'
        ? colors.reading
        : variant === 'topup'
            ? colors.topup
            : colors.reading;

    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <View className={`mb-4 ${className}`} style={containerStyle}>
            {label && (
                <Text className="text-sm font-medium text-slate-800 mb-1.5">
                    {label}
                </Text>
            )}
            <View
                className={`flex-row items-center bg-white border rounded-xl overflow-hidden ${error ? 'border-error' : 'border-border'
                    }`}
                style={isFocused ? { borderColor: focusColor } : undefined}
            >
                {leftIcon && <View className="pl-3">{leftIcon}</View>}
                <TextInput
                    className={`flex-1 px-4 py-3.5 text-base text-slate-800 ${leftIcon ? 'pl-2' : ''
                        } ${rightIcon ? 'pr-2' : ''}`}
                    placeholderTextColor={colors.textSecondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={style}
                    {...props}
                />
                {rightIcon && <View className="pr-3">{rightIcon}</View>}
            </View>
            {error && (
                <Text className="text-xs text-error mt-1">{error}</Text>
            )}
        </View>
    );
}
