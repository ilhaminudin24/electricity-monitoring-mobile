import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';

type FilterType = 'day' | 'week' | 'month';

interface GlobalFilterBarProps {
    filter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

export function GlobalFilterBar({ filter, onFilterChange }: GlobalFilterBarProps) {
    const filters: { key: FilterType; label: string }[] = [
        { key: 'day', label: 'Hari' },
        { key: 'week', label: 'Minggu' },
        { key: 'month', label: 'Bulan' },
    ];

    return (
        <View className="flex-row bg-surface rounded-xl p-1 mx-6 mb-4 border border-border">
            {filters.map(({ key, label }) => (
                <TouchableOpacity
                    key={key}
                    className={`flex-1 py-2.5 px-4 rounded-lg items-center ${filter === key ? 'bg-reading' : ''
                        }`}
                    onPress={() => onFilterChange(key)}
                >
                    <Text
                        className={`text-sm font-medium ${filter === key ? 'text-white font-semibold' : 'text-slate-500'
                            }`}
                    >
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}
