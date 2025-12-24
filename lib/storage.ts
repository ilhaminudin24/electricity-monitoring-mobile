import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TariffSettings, Reading } from '@/types';

const KEYS = {
    SETTINGS: 'app_settings',
    LANGUAGE: 'app_language',
    BIOMETRIC_ENABLED: 'biometric_enabled',
    CACHED_READINGS: 'cached_readings',
    OFFLINE_QUEUE: 'offline_queue',
} as const;

// Settings
export async function getSettings(): Promise<TariffSettings | null> {
    try {
        const data = await AsyncStorage.getItem(KEYS.SETTINGS);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export async function saveSettings(settings: TariffSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// Language
export async function getLanguage(): Promise<string> {
    try {
        return (await AsyncStorage.getItem(KEYS.LANGUAGE)) || 'id';
    } catch {
        return 'id';
    }
}

export async function setLanguage(lang: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

// Biometric preference
export async function getBiometricEnabled(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(KEYS.BIOMETRIC_ENABLED);
        return value === 'true';
    } catch {
        return false;
    }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.BIOMETRIC_ENABLED, enabled.toString());
}

// Cached readings for offline support
export async function getCachedReadings(): Promise<Reading[]> {
    try {
        const data = await AsyncStorage.getItem(KEYS.CACHED_READINGS);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export async function setCachedReadings(readings: Reading[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CACHED_READINGS, JSON.stringify(readings));
}

// Offline queue for pending submissions
export async function getOfflineQueue(): Promise<Partial<Reading>[]> {
    try {
        const data = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export async function addToOfflineQueue(reading: Partial<Reading>): Promise<void> {
    const queue = await getOfflineQueue();
    queue.push(reading);
    await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export async function clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.OFFLINE_QUEUE);
}

// Clear all app data (for logout)
export async function clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
        KEYS.SETTINGS,
        KEYS.CACHED_READINGS,
        KEYS.OFFLINE_QUEUE,
        // Note: We keep LANGUAGE and BIOMETRIC_ENABLED preferences
    ]);
}
