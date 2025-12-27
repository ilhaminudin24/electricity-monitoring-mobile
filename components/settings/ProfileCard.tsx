/**
 * ProfileCard Component
 * Displays user avatar, name (editable), and email
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { Pencil, Check, X } from 'lucide-react-native';

interface ProfileCardProps {
    displayName: string;
    email: string;
    onNameChange: (name: string) => Promise<boolean>;
}

export function ProfileCard({ displayName, email, onNameChange }: ProfileCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(displayName);
    const [isSaving, setIsSaving] = useState(false);

    const handleStartEdit = () => {
        setEditedName(displayName);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditedName(displayName);
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        if (editedName.trim() === displayName) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        const success = await onNameChange(editedName.trim());
        setIsSaving(false);

        if (success) {
            setIsEditing(false);
        }
    };

    // Get initials for avatar
    const initials = displayName
        ? displayName.charAt(0).toUpperCase()
        : email?.charAt(0).toUpperCase() || '?';

    return (
        <View style={styles.container}>
            {/* Avatar */}
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
                {/* Name - Editable */}
                {isEditing ? (
                    <View style={styles.editRow}>
                        <TextInput
                            style={styles.nameInput}
                            value={editedName}
                            onChangeText={setEditedName}
                            autoFocus
                            selectTextOnFocus
                            editable={!isSaving}
                        />
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleSaveEdit}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color={colors.secondary[500]} />
                            ) : (
                                <Check size={18} color={colors.secondary[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleCancelEdit}
                            disabled={isSaving}
                        >
                            <X size={18} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{displayName || 'User'}</Text>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleStartEdit}
                        >
                            <Pencil size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Email - Read Only */}
                <Text style={styles.email}>{email}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    info: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nameInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        padding: 4,
        backgroundColor: colors.background,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.primary[500],
    },
    iconButton: {
        padding: 6,
    },
    email: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
