/**
 * Date formatting utilities
 * Adapted from web app for React Native
 */

import { format, parseISO, isValid, differenceInDays, startOfDay } from 'date-fns';
import { id, enUS } from 'date-fns/locale';

type DateInput = Date | string | number;

/**
 * Parse date input to Date object
 */
const parseDate = (date: DateInput): Date => {
    if (date instanceof Date) {
        return date;
    }
    if (typeof date === 'string') {
        const parsed = parseISO(date);
        return isValid(parsed) ? parsed : new Date(date);
    }
    return new Date(date);
};

/**
 * Format date for display
 * @param date - Date to format
 * @param formatStr - date-fns format string (default: 'd MMM yyyy')
 * @param locale - 'id' or 'en' (default: 'id')
 */
export const formatDate = (
    date: DateInput,
    formatStr = 'd MMM yyyy',
    locale: 'id' | 'en' = 'id'
): string => {
    const dateObj = parseDate(date);
    if (!isValid(dateObj)) return '-';

    return format(dateObj, formatStr, {
        locale: locale === 'id' ? id : enUS,
    });
};

/**
 * Format date and time for display
 * @param date - Date to format
 */
export const formatDateTime = (date: DateInput): string => {
    const dateObj = parseDate(date);
    if (!isValid(dateObj)) return '-';

    return format(dateObj, 'd MMM yyyy, HH:mm', { locale: id });
};

/**
 * Format time only
 * @param date - Date to format
 */
export const formatTime = (date: DateInput): string => {
    const dateObj = parseDate(date);
    if (!isValid(dateObj)) return '-';

    return format(dateObj, 'HH:mm', { locale: id });
};

/**
 * Format date for API/storage (ISO format)
 * @param date - Date to format
 */
export const formatDateForApi = (date: DateInput): string => {
    const dateObj = parseDate(date);
    if (!isValid(dateObj)) return '';

    return dateObj.toISOString();
};

/**
 * Format date only (YYYY-MM-DD) for database queries
 * @param date - Date to format
 */
export const formatDateOnly = (date: DateInput): string => {
    const dateObj = parseDate(date);
    if (!isValid(dateObj)) return '';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Get relative date description (Today, Yesterday, etc.)
 * @param date - Date to describe
 */
export const getRelativeDateLabel = (date: DateInput): string => {
    const dateObj = startOfDay(parseDate(date));
    const today = startOfDay(new Date());
    const diffDays = differenceInDays(today, dateObj);

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;

    return formatDate(dateObj);
};

/**
 * Check if date is today
 */
export const isToday = (date: DateInput): boolean => {
    const dateObj = startOfDay(parseDate(date));
    const today = startOfDay(new Date());
    return differenceInDays(today, dateObj) === 0;
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: DateInput): boolean => {
    const dateObj = startOfDay(parseDate(date));
    const today = startOfDay(new Date());
    return differenceInDays(today, dateObj) === 1;
};

export { parseISO, isValid, differenceInDays };
