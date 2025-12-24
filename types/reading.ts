/**
 * Reading types for electricity monitoring
 */

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

export interface ReadingInput {
    date: string;
    kwh: number;
    token_cost?: number | null;
    token_amount?: number | null;
    notes?: string | null;
}

export type InputMode = 'reading' | 'topup';

export interface ConsumptionPreviewData {
    previousReading: number;
    currentReading: number;
    consumption: number;
    estimatedCost: number;
}

export interface TopUpPreviewData {
    tokenCost: number;
    estimatedKwh: number;
    previousReading: number;
    newReading: number;
}

// Form state for Reading mode
export interface ReadingFormData {
    date: Date;
    kwhValue: string;
    notes: string;
    photoUri: string | null;
}

// Form state for TopUp mode
export interface TopUpFormData {
    date: Date;
    tokenCost: string;
    calculatedKwh: number | null;
    newKwhValue: string;
    notes: string;
    photoUri: string | null;
}

// Validation errors
export interface FormErrors {
    date?: string;
    kwhValue?: string;
    tokenCost?: string;
    general?: string;
}
