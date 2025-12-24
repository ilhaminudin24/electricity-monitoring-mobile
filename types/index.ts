// User types
export interface User {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
}

export interface AuthState {
    user: User | null;
    session: any | null;
    loading: boolean;
    initialized: boolean;
}

// Reading types
export interface Reading {
    id: string;
    user_id: string;
    date: string;
    kwh_value: number;
    token_cost?: number | null;
    token_amount?: number | null;
    notes?: string | null;
    meter_photo_url?: string | null;
    created_at: string;
}

export interface DailyUsage {
    date: string;
    usage: number;
    isTopUp?: boolean;
    tokenCost?: number;
}

// Tariff types
export interface TariffTier {
    id: string;
    tariff_group: string;
    power_capacity: number;
    nominal_min: number;
    nominal_max: number;
    effective_tariff: number;
    is_subsidized: boolean;
}

export interface TariffSettings {
    mode: 'pln' | 'custom';
    tariffGroup?: string;
    powerCapacity?: number;
    customTariffName?: string;
    customTariffRate?: number;
    adminFee: number;
    taxPercent: number;
    monthlyBudget?: number;
    alertThreshold?: number;
    fallbackRate?: number;
}

// User profile types
export interface UserProfile {
    id: string;
    display_name: string;
    role: 'user' | 'admin';
    status: 'active' | 'inactive';
    tariff_settings?: TariffSettings;
    last_login?: string;
    created_at: string;
}

// Form types
export type InputMode = 'reading' | 'topup';

export interface ReadingFormData {
    date: Date;
    kwhValue: string;
    notes: string;
    photoUri?: string;
}

export interface TopUpFormData {
    date: Date;
    tokenCost: string;
    calculatedKwh: number | null;
    newMeterPosition: string;
    notes: string;
    photoUri?: string;
}

// Filter types
export type TimeFilter = 'day' | 'week' | 'month';
export type DateRangeFilter = '30days' | '12months' | 'all';
export type TypeFilter = 'all' | 'reading' | 'topup';
