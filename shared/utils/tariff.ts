/**
 * Tariff Utilities
 * Helper functions for tiered tariff calculations
 * Adapted from web app for React Native
 */

import { getSettings, getTariffPerKwh, DEFAULT_SETTINGS } from './settings';

export interface TariffCalculationResult {
    kwh: number | null;
    effectiveTariff: number | null;
    tierLabel: string | null;
    source: 'tier' | 'fallback' | 'settings_fallback' | 'none';
    taxAmount: number;
    netAmount: number;
    tierId: string | null;
    error?: string;
}

export interface EstimateKwhParams {
    tokenCost: number;
    adminFee?: number;
    taxPercent?: number;
    fallbackRate?: number | null;
}

/**
 * Estimate kWh from token cost using tariff settings
 * Simplified version for mobile - uses local settings only (no Supabase tiers)
 */
export async function estimateKwhFromTokenCost({
    tokenCost,
    adminFee = 0,
    taxPercent = 0,
    fallbackRate = null,
}: EstimateKwhParams): Promise<TariffCalculationResult> {
    const tokenCostNum = Number(tokenCost);
    const adminFeeNum = Number(adminFee) || 0;
    const taxPercentNum = Number(taxPercent) || 0;

    // Calculate tax amount
    const taxAmount = tokenCostNum * (taxPercentNum / 100);

    // Calculate net amount after admin fee and tax
    const netAmount = tokenCostNum - adminFeeNum - taxAmount;

    // Use fallback rate if provided
    if (fallbackRate) {
        const fallbackRateNum = Number(fallbackRate);
        const kwh = netAmount / fallbackRateNum;

        return {
            kwh: Number(kwh.toFixed(3)),
            effectiveTariff: fallbackRateNum,
            tierLabel: null,
            source: 'fallback',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: null,
        };
    }

    // Use settings fallback
    try {
        const settings = getSettings();
        const defaultRate = settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh;
        const kwh = netAmount / defaultRate;

        return {
            kwh: Number(kwh.toFixed(3)),
            effectiveTariff: defaultRate,
            tierLabel: null,
            source: 'settings_fallback',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: null,
        };
    } catch (error) {
        // Absolute last resort
        return {
            kwh: null,
            effectiveTariff: null,
            tierLabel: null,
            source: 'none',
            taxAmount: Number(taxAmount.toFixed(2)),
            netAmount: Number(netAmount.toFixed(2)),
            tierId: null,
            error: 'Unable to calculate kWh: No tariff tier or fallback rate available',
        };
    }
}

/**
 * Get fallback rate from settings
 */
export function getFallbackTariffRate(): number {
    try {
        return getTariffPerKwh();
    } catch (error) {
        return 1444.70; // Hardcoded default
    }
}

/**
 * Calculate Token Amount (kWh) from Token Cost
 * Uses tariff from settings
 */
export async function calculateTokenAmount(
    tokenCost: number,
    options: { featureEnabled?: boolean } = {}
): Promise<number | null> {
    if (!tokenCost || tokenCost <= 0) {
        return null;
    }

    const settings = getSettings();
    const adminFee = settings.adminFee || 0;
    const taxPercent = settings.tax || 0;

    const result = await estimateKwhFromTokenCost({
        tokenCost,
        adminFee,
        taxPercent,
        fallbackRate: settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh,
    });

    return result.kwh;
}

/**
 * Format tier range for display (if using tiered system later)
 */
export function formatTierRange(tier: { min_nominal: number; max_nominal: number | null }): string {
    if (!tier) return '';

    if (tier.max_nominal === null) {
        return `≥ ${tier.min_nominal.toLocaleString('id-ID')}`;
    }

    if (tier.min_nominal === tier.max_nominal) {
        return tier.min_nominal.toLocaleString('id-ID');
    }

    return `${tier.min_nominal.toLocaleString('id-ID')} - ${tier.max_nominal.toLocaleString('id-ID')}`;
}
