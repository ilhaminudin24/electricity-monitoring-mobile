import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { Zap, BarChart3 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import type { InputMode } from '@/types/reading';

interface TabSelectorProps {
    mode: InputMode;
    onModeChange: (mode: InputMode) => void;
}

export function TabSelector({ mode, onModeChange }: TabSelectorProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    mode === 'reading' && styles.tabActiveReading,
                ]}
                onPress={() => onModeChange('reading')}
                activeOpacity={0.7}
            >
                <BarChart3
                    size={20}
                    color={mode === 'reading' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                    style={[
                        styles.tabText,
                        mode === 'reading' && styles.tabTextActive,
                    ]}
                >
                    Catat Meter
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tab,
                    mode === 'topup' && styles.tabActiveTopUp,
                ]}
                onPress={() => onModeChange('topup')}
                activeOpacity={0.7}
            >
                <Zap
                    size={20}
                    color={mode === 'topup' ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                    style={[
                        styles.tabText,
                        mode === 'topup' && styles.tabTextActive,
                    ]}
                >
                    Top Up Token
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.slate[100],
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 8,
    },
    tabActiveReading: {
        backgroundColor: colors.reading,
        shadowColor: colors.reading,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    tabActiveTopUp: {
        backgroundColor: colors.topup,
        shadowColor: colors.topup,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
});
