/**
 * Settings management for electricity monitoring app
 * Uses AsyncStorage for React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// PLN Tariff Data
export const plnTariffsData = {
    tariffGroups: [
        {
            id: 'R1',
            name: 'R1',
            description: 'Rumah Tangga Daya Rendah',
            subcategories: [
                { id: 'R1_450', name: '450 VA', rate: 415, isSubsidized: true },
                { id: 'R1_900', name: '900 VA', rate: 1352, isSubsidized: true },
                { id: 'R1_1300', name: '1300 VA', rate: 1444.70, isSubsidized: true },
                { id: 'R1_2200', name: '2200 VA', rate: 1444.70, isSubsidized: true },
            ]
        },
        {
            id: 'R2',
            name: 'R2',
            description: 'Rumah Tangga Daya Sedang',
            subcategories: [
                { id: 'R2_3500', name: '3500 VA', rate: 1444.70 },
                { id: 'R2_4400', name: '4400 VA', rate: 1444.70 },
                { id: 'R2_5500', name: '5500 VA', rate: 1444.70 },
                { id: 'R2_6600', name: '6600 VA', rate: 1444.70 },
            ]
        },
        {
            id: 'R3',
            name: 'R3',
            description: 'Rumah Tangga Daya Tinggi',
            subcategories: [
                { id: 'R3_6600', name: '6600 VA', rate: 1444.70 },
                { id: 'R3_10600', name: '10600 VA', rate: 1444.70 },
                { id: 'R3_13200', name: '13200 VA', rate: 1444.70 },
            ]
        },
        {
            id: 'B1',
            name: 'B1',
            description: 'Bisnis Daya Rendah',
            subcategories: [
                { id: 'B1_5300', name: '5300 VA', rate: 1444.70 },
                { id: 'B1_8900', name: '8900 VA', rate: 1444.70 },
            ]
        },
    ]
};

export interface TariffSubcategory {
    id: string;
    name: string;
    rate: number;
    isSubsidized?: boolean;
}

export interface TariffGroup {
    id: string;
    name: string;
    description: string;
    subcategories: TariffSubcategory[];
}

export interface Settings {
    tariffType: 'preset' | 'custom';
    selectedTariffGroup: string;
    selectedTariffSubcategory: string;
    tariffPerKwh: number;
    adminFee: number;
    customTariffName: string;
    customTariffRate: number;
    tax: number;
    monthlyBudget: number;
    budgetAlertThreshold: number;
    useGlobalTariffTiers?: boolean;
}

const SETTINGS_KEY = 'electricity_monitoring_settings';

export const DEFAULT_SETTINGS: Settings = {
    tariffType: 'preset',
    selectedTariffGroup: 'R1',
    selectedTariffSubcategory: 'R1_1300',
    tariffPerKwh: 1444.70,
    adminFee: 0,
    customTariffName: '',
    customTariffRate: 0,
    tax: 0,
    monthlyBudget: 500000,
    budgetAlertThreshold: 85,
    useGlobalTariffTiers: true,
};

/**
 * Get all available PLN tariffs
 */
export const getAvailableTariffs = () => {
    return plnTariffsData;
};

/**
 * Find tariff rate by ID
 */
export const getTariffRateById = (tariffId: string): number => {
    for (const group of plnTariffsData.tariffGroups) {
        const subcategory = group.subcategories.find(sub => sub.id === tariffId);
        if (subcategory) {
            return subcategory.rate;
        }
    }
    return DEFAULT_SETTINGS.tariffPerKwh;
};

/**
 * Get tariff group and subcategory details
 */
export const getTariffDetails = (tariffId: string): { group: TariffGroup; subcategory: TariffSubcategory } | null => {
    for (const group of plnTariffsData.tariffGroups) {
        const subcategory = group.subcategories.find(sub => sub.id === tariffId);
        if (subcategory) {
            return { group, subcategory };
        }
    }
    return null;
};

// In-memory cache for synchronous access
let cachedSettings: Settings | null = null;

/**
 * Get all settings (synchronous - uses cache)
 * Call loadSettings() first to populate cache
 */
export const getSettings = (): Settings => {
    return cachedSettings || DEFAULT_SETTINGS;
};

/**
 * Load settings from AsyncStorage (async)
 */
export const loadSettings = async (): Promise<Settings> => {
    try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const mergedSettings: Settings = { ...DEFAULT_SETTINGS, ...parsed };
            cachedSettings = mergedSettings;
            return mergedSettings;
        }
        cachedSettings = DEFAULT_SETTINGS;
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error loading settings:', error);
        cachedSettings = DEFAULT_SETTINGS;
        return DEFAULT_SETTINGS;
    }
};

/**
 * Save settings to AsyncStorage
 */
export const saveSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
    try {
        const current = getSettings();
        const updated = { ...current, ...newSettings };
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        cachedSettings = updated;
        return updated;
    } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
    }
};

/**
 * Update settings (alias for saveSettings)
 */
export const updateSettings = saveSettings;

/**
 * Get current effective tariff rate
 */
export const getTariffPerKwh = (): number => {
    const settings = getSettings();
    return settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh;
};

/**
 * Get admin fee
 */
export const getAdminFee = (): number => {
    return getSettings().adminFee || 0;
};

/**
 * Get tax (as decimal, e.g., 10% = 0.10)
 */
export const getTax = (): number => {
    const settings = getSettings();
    return (settings.tax || 0) / 100;
};

/**
 * Get monthly budget setting
 */
export const getMonthlyBudget = (): number => {
    const settings = getSettings();
    return settings.monthlyBudget || 500000;
};

/**
 * Calculate proportional budget based on time range
 */
export const getBudgetForPeriod = (timeRange: 'day' | 'week' | 'month'): number => {
    const monthlyBudget = getMonthlyBudget();

    switch (timeRange) {
        case 'day':
            return monthlyBudget / 30;
        case 'week':
            return (monthlyBudget / 30) * 7;
        case 'month':
        default:
            return monthlyBudget;
    }
};

/**
 * Get budget alert threshold (percentage)
 */
export const getBudgetAlertThreshold = (): number => {
    const settings = getSettings();
    return settings.budgetAlertThreshold || 85;
};

/**
 * Reset to default settings
 */
export const resetToDefaults = async (): Promise<Settings> => {
    try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
        cachedSettings = DEFAULT_SETTINGS;
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Error resetting settings:', error);
        return DEFAULT_SETTINGS;
    }
};
