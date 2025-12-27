/**
 * Settings Screen
 * User profile, base fees, and budget configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { ProfileCard } from '@/components/settings/ProfileCard';
import { BaseFeesConfig } from '@/components/settings/BaseFeesConfig';
import { BudgetConfig } from '@/components/settings/BudgetConfig';
import { loadHybridSettings, saveHybridSettings, updateDisplayName } from '@/lib/settingsService';
import { Settings, DEFAULT_SETTINGS } from '@/shared/utils/settings';
import { Save, LogOut } from 'lucide-react-native';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Settings state
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [adminFee, setAdminFee] = useState('');
    const [taxPercent, setTaxPercent] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [alertThreshold, setAlertThreshold] = useState(85);

    // Track if settings have changed
    const [hasChanges, setHasChanges] = useState(false);

    // Load settings on mount
    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;

            try {
                const settings = await loadHybridSettings(user.id);
                setAdminFee(settings.adminFee?.toString() || '0');
                setTaxPercent(settings.tax?.toString() || '0');
                setMonthlyBudget(settings.monthlyBudget?.toString() || '500000');
                setAlertThreshold(settings.budgetAlertThreshold || 85);
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user?.id]);

    // Update display name from auth context
    useEffect(() => {
        if (user?.display_name) {
            setDisplayName(user.display_name);
        }
    }, [user?.display_name]);

    // Track changes
    useEffect(() => {
        setHasChanges(true);
    }, [adminFee, taxPercent, monthlyBudget, alertThreshold]);

    // Handle name change
    const handleNameChange = useCallback(async (newName: string): Promise<boolean> => {
        if (!user?.id) return false;

        const success = await updateDisplayName(user.id, newName);
        if (success) {
            setDisplayName(newName);
        }
        return success;
    }, [user?.id]);

    // Handle save
    const handleSave = async () => {
        if (!user?.id) return;

        setIsSaving(true);

        try {
            const settingsToSave: Partial<Settings> = {
                adminFee: parseFloat(adminFee) || 0,
                tax: parseFloat(taxPercent) || 0,
                monthlyBudget: parseFloat(monthlyBudget) || 500000,
                budgetAlertThreshold: alertThreshold,
            };

            await saveHybridSettings(user.id, settingsToSave);
            setHasChanges(false);

            if (Platform.OS === 'web') {
                alert('Pengaturan berhasil disimpan');
            } else {
                Alert.alert('Sukses', 'Pengaturan berhasil disimpan');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            if (Platform.OS === 'web') {
                alert('Gagal menyimpan pengaturan');
            } else {
                Alert.alert('Error', 'Gagal menyimpan pengaturan');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Handle sign out
    const handleSignOut = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Apakah Anda yakin ingin keluar?');
            if (confirmed) {
                await signOut();
            }
        } else {
            Alert.alert(
                'Logout',
                'Apakah Anda yakin ingin keluar?',
                [
                    { text: 'Batal', style: 'cancel' },
                    {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: signOut,
                    },
                ]
            );
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Memuat pengaturan...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Pengaturan</Text>
                <Text style={styles.subtitle}>Kelola akun dan preferensi</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Card */}
                <ProfileCard
                    displayName={displayName}
                    email={user?.email || ''}
                    onNameChange={handleNameChange}
                />

                {/* Base Fees Config */}
                <View style={styles.section}>
                    <BaseFeesConfig
                        adminFee={adminFee}
                        taxPercent={taxPercent}
                        onAdminFeeChange={setAdminFee}
                        onTaxPercentChange={setTaxPercent}
                    />
                </View>

                {/* Budget Config */}
                <View style={styles.section}>
                    <BudgetConfig
                        monthlyBudget={monthlyBudget}
                        alertThreshold={alertThreshold}
                        onMonthlyBudgetChange={setMonthlyBudget}
                        onAlertThresholdChange={setAlertThreshold}
                    />
                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Save size={18} color="white" />
                            <Text style={styles.saveText}>Simpan Pengaturan</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleSignOut}
                >
                    <LogOut size={18} color={colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    header: {
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 0,
    },
    section: {
        marginTop: 16,
    },
    footer: {
        padding: 24,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary[600],
        borderRadius: 12,
        padding: 16,
    },
    saveText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error,
        padding: 16,
    },
    logoutText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
