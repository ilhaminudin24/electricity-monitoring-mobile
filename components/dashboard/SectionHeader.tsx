import React from 'react';
import { View, Text } from 'react-native';

interface SectionHeaderProps {
    title: string;
    emoji?: string;
    subtitle?: string;
}

export function SectionHeader({ title, emoji, subtitle }: SectionHeaderProps) {
    return (
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center gap-2">
                {emoji && <Text className="text-base">{emoji}</Text>}
                <Text className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    {title}
                </Text>
            </View>
            {subtitle && (
                <Text className="text-xs text-slate-400 mt-0.5 ml-6">
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
