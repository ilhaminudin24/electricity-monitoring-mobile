import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
            style={[
                styles.container,
                {
                    backgroundColor: style.backgroundColor,
                    borderColor: style.borderColor,
                },
            ]}
        >
            <View style={styles.iconContainer}>
                {type === 'info' ? (
                    <TrendingUp size={20} color={style.iconColor} />
                ) : (
                    <AlertTriangle size={20} color={style.iconColor} />
                )}
            </View>

            <View style={styles.content}>
                <Text style={[styles.title, { color: style.iconColor }]}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
            </View>

            {dismissable && onDismiss && (
                <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
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
        <View style={styles.alertWrapper}>
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

const styles = StyleSheet.create({
    alertWrapper: {
        marginHorizontal: 24,
        marginBottom: 12,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    dismissButton: {
        padding: 4,
        marginLeft: 8,
    },
});
