/**
 * Settings Service
 * Hybrid settings management: Local first, then cloud sync via Supabase
 */

import { supabase } from './supabase';
import { Settings, loadSettings, saveSettings as saveLocalSettings } from '@/shared/utils/settings';

/**
 * Load settings from cloud (Supabase user_profiles.tariff_settings)
 */
export async function loadCloudSettings(userId: string): Promise<Partial<Settings> | null> {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('tariff_settings')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return data?.tariff_settings || null;
    } catch (error) {
        console.error('Error loading cloud settings:', error);
        return null;
    }
}

/**
 * Save settings to cloud (Supabase user_profiles.tariff_settings)
 */
export async function saveCloudSettings(userId: string, settings: Settings): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ tariff_settings: settings })
            .eq('id', userId);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error saving cloud settings:', error);
        return false;
    }
}

/**
 * Load settings with hybrid approach:
 * 1. Load local first (instant)
 * 2. Fetch cloud settings
 * 3. Merge cloud → local (cloud takes priority)
 */
export async function loadHybridSettings(userId: string): Promise<Settings> {
    // Load local first
    const localSettings = await loadSettings();

    // Try to load cloud settings
    const cloudSettings = await loadCloudSettings(userId);

    if (cloudSettings) {
        // Merge cloud settings (cloud takes priority)
        const merged = { ...localSettings, ...cloudSettings };
        // Save merged to local cache
        await saveLocalSettings(merged);
        return merged;
    }

    return localSettings;
}

/**
 * Save settings to both local and cloud
 */
export async function saveHybridSettings(userId: string, settings: Partial<Settings>): Promise<Settings> {
    // Save to local first
    const updatedSettings = await saveLocalSettings(settings);

    // Sync to cloud
    await saveCloudSettings(userId, updatedSettings);

    return updatedSettings;
}

/**
 * Update user display name
 */
export async function updateDisplayName(userId: string, displayName: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({ display_name: displayName })
            .eq('id', userId);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error updating display name:', error);
        return false;
    }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}
