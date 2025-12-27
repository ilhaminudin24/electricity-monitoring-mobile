import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, X, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export type AlertType = 'warning' | 'danger' | 'info';

interface AlertBoxProps {
    type: AlertType;
    title: string;
    message: string;
    dismissable?: boolean;
    onDismiss?: () => void;
}

export function AlertBox({ type, title, message, dismissable = true, onDismiss }: AlertBoxProps) {
    const getStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    backgroundColor: `${colors.error}15`,
                    borderColor: colors.error,
                    iconColor: colors.error,
                };
            case 'warning':
                return {
                    backgroundColor: `${colors.topup}15`,
                    borderColor: colors.topup,
                    iconColor: colors.topup,
                };
            case 'info':
            default:
                return {
                    backgroundColor: `${colors.info}15`,
                    borderColor: colors.info,
                    iconColor: colors.info,
                };
        }
    };

    const style = getStyles();

    return (
        <View
            className="flex-row items-start p-3.5 rounded-xl border"
            style={{
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor,
            }}
        >
            <View className="mr-3 mt-0.5">
                {type === 'info' ? (
                    <TrendingUp size={20} color={style.iconColor} />
                ) : (
                    <AlertTriangle size={20} color={style.iconColor} />
                )}
            </View>

            <View className="flex-1">
                <Text
                    className="text-sm font-semibold mb-1"
                    style={{ color: style.iconColor }}
                >
                    {title}
                </Text>
                <Text className="text-[13px] text-slate-500 leading-[18px]">
                    {message}
                </Text>
            </View>

            {dismissable && onDismiss && (
                <TouchableOpacity className="p-1 ml-2" onPress={onDismiss}>
                    <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );
}

// Helper component for usage alerts
interface UsageAlertProps {
    percentage: number;
    threshold: number;
    onDismiss?: () => void;
}

export function UsageAlert({ percentage, threshold, onDismiss }: UsageAlertProps) {
    if (percentage < threshold) return null;

    const isOverBudget = percentage >= 100;

    return (
        <View className="mx-6 mb-3">
            <AlertBox
                type={isOverBudget ? 'danger' : 'warning'}
                title={isOverBudget ? 'Melebihi Budget!' : 'Peringatan Penggunaan'}
                message={
                    isOverBudget
                        ? `Penggunaan Anda sudah ${percentage.toFixed(0)}% dari budget bulanan.`
                        : `Penggunaan Anda sudah mencapai ${percentage.toFixed(0)}% dari budget bulanan.`
                }
                onDismiss={onDismiss}
            />
        </View>
    );
}
