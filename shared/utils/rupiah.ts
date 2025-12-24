/**
 * Indonesian Rupiah formatting utilities
 * Adapted from web app for React Native
 */

/**
 * Format number as Rupiah
 * @param amount - The amount to format
 * @returns Formatted string like "Rp 200.000"
 */
export const formatRupiah = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || amount === '') {
        return '-';
    }

    const num = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^\d]/g, ''))
        : amount;

    if (isNaN(num) || num === 0) {
        return '-';
    }

    // Format with Indonesian locale
    return `Rp ${num.toLocaleString('id-ID')}`;
};

/**
 * Parse Rupiah formatted string to number
 * @param rupiahString - Formatted string like "Rp 200.000" or "200000"
 * @returns Numeric value
 */
export const parseRupiah = (rupiahString: string | null | undefined): number => {
    if (!rupiahString) return 0;

    // Remove all non-digit characters
    const cleaned = String(rupiahString).replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
};

/**
 * Format number for input field (without currency symbol, with thousand separators)
 * @param amount - The amount to format
 * @returns Formatted string like "200.000"
 */
export const formatRupiahInput = (amount: number | string | null | undefined): string => {
    if (!amount && amount !== 0) return '';

    const num = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^\d]/g, ''))
        : amount;

    if (isNaN(num)) return '';

    return num.toLocaleString('id-ID');
};

/**
 * Format kWh value for display
 * @param kwh - kWh value
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string like "145.50 kWh"
 */
export const formatKwh = (kwh: number | null | undefined, decimals = 2): string => {
    if (kwh === null || kwh === undefined) {
        return '-';
    }

    return `${kwh.toFixed(decimals)} kWh`;
};
