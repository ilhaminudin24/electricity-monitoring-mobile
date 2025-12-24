/**
 * Reading Service
 * Supabase operations for electricity readings
 * Adapted from web app supabaseService.js
 */

import { supabase } from './supabase';
import { Reading, ReadingInput } from '@/types/reading';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Ensure user profile exists (auto-create if missing)
 */
export const ensureUserProfile = async (
    userId: string,
    userEmail?: string | null,
    userName?: string | null
): Promise<{ id: string }> => {
    try {
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (existingProfile && !checkError) {
            return existingProfile;
        }

        // Create new profile
        const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
                id: userId,
                display_name: userName || userEmail || 'User',
                role: 'user',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (createError) {
            // Try upsert on conflict
            const { data: upsertedProfile, error: upsertError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: userId,
                    display_name: userName || userEmail || 'User',
                    role: 'user',
                    status: 'active',
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })
                .select()
                .single();

            if (upsertError) throw upsertError;
            return upsertedProfile!;
        }

        return newProfile!;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if a reading exists for a specific date
 */
export const checkReadingExists = async (
    userId: string,
    date: Date | string
): Promise<Reading | null> => {
    try {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;

        const { data, error } = await supabase
            .from('electricity_readings')
            .select('id, date, kwh_value, token_cost, notes, created_at')
            .eq('user_id', userId)
            .gte('date', dateOnly)
            .lt('date', `${dateOnly}T23:59:59.999Z`)
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Reading | null;
    } catch (error) {
        console.error('Error checking existing reading:', error);
        return null;
    }
};

/**
 * Get the last reading for a user
 */
export const getLastReading = async (userId: string): Promise<Reading | null> => {
    try {
        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return (data as Reading) || null;
    } catch (error) {
        return null;
    }
};

/**
 * Get the last reading before a specific date (ignoring time)
 * Used for date-aware validation when inputting new readings
 */
export const getLastReadingBeforeDate = async (
    userId: string,
    date: Date | string
): Promise<Reading | null> => {
    try {
        // Extract date-only string (YYYY-MM-DD) using local time
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;

        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .lt('date', dateOnly) // strictly less than the selected date
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        return (data as Reading) || null;
    } catch (error) {
        console.error('Error fetching last reading before date:', error);
        return null;
    }
};

/**
 * Upload meter photo to Supabase Storage
 */
export const uploadMeterPhoto = async (
    uri: string,
    userId: string
): Promise<string | null> => {
    try {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // Get file extension
        const ext = uri.split('.').pop() || 'jpg';
        const fileName = `${userId}/${Date.now()}.${ext}`;

        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const { error: uploadError } = await supabase.storage
            .from('meter-photos')
            .upload(fileName, bytes.buffer, {
                contentType: `image/${ext}`,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('meter-photos')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Photo upload error:', error);
        return null;
    }
};

/**
 * Add new reading
 */
export const addReading = async (
    userId: string,
    readingData: ReadingInput,
    photoUri?: string | null
): Promise<Reading> => {
    try {
        // Ensure user profile exists
        await ensureUserProfile(userId);

        let photoUrl: string | null = null;

        // Upload photo if exists
        if (photoUri) {
            photoUrl = await uploadMeterPhoto(photoUri, userId);
        }

        // Insert reading
        const { data, error } = await supabase
            .from('electricity_readings')
            .insert({
                user_id: userId,
                date: readingData.date,
                kwh_value: parseFloat(String(readingData.kwh)),
                token_cost: readingData.token_cost || null,
                token_amount: readingData.token_amount || null,
                notes: readingData.notes || null,
                meter_photo_url: photoUrl,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23503') {
                throw new Error('User profile not found. Please try logging out and logging back in.');
            }
            throw error;
        }

        return data as Reading;
    } catch (error) {
        throw error;
    }
};

/**
 * Update existing reading
 */
export const updateReading = async (
    readingId: string,
    updates: Partial<ReadingInput>
): Promise<Reading> => {
    try {
        const updateData: Record<string, unknown> = {};

        if (updates.kwh !== undefined) {
            updateData.kwh_value = parseFloat(String(updates.kwh));
        }
        if (updates.date !== undefined) {
            updateData.date = updates.date;
        }
        if (updates.token_cost !== undefined) {
            updateData.token_cost = updates.token_cost;
        }
        if (updates.token_amount !== undefined) {
            updateData.token_amount = updates.token_amount;
        }
        if (updates.notes !== undefined) {
            updateData.notes = updates.notes;
        }

        const { data, error } = await supabase
            .from('electricity_readings')
            .update(updateData)
            .eq('id', readingId)
            .select()
            .single();

        if (error) throw error;
        return data as Reading;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete reading
 */
export const deleteReading = async (readingId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('electricity_readings')
            .delete()
            .eq('id', readingId);

        if (error) throw error;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all readings (for dashboard)
 */
export const getAllReadings = async (
    userId: string,
    limit = 1000
): Promise<Reading[]> => {
    try {
        const { data, error } = await supabase
            .from('electricity_readings')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data as Reading[]) || [];
    } catch (error) {
        throw error;
    }
};
