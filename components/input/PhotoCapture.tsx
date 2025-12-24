import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface PhotoCaptureProps {
    photoUri: string | null;
    onPhotoChange: (uri: string | null) => void;
    variant?: 'reading' | 'topup';
}

export function PhotoCapture({
    photoUri,
    onPhotoChange,
    variant = 'reading',
}: PhotoCaptureProps) {
    const [loading, setLoading] = useState(false);
    const accentColor = variant === 'topup' ? colors.topup : colors.reading;

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted') {
            Alert.alert(
                'Izin Diperlukan',
                'Izin kamera diperlukan untuk mengambil foto meter.'
            );
            return false;
        }
        return true;
    };

    const takePhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        setLoading(true);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                quality: 0.7,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                onPhotoChange(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Gagal mengambil foto');
        } finally {
            setLoading(false);
        }
    };

    const pickFromGallery = async () => {
        setLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                quality: 0.7,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                onPhotoChange(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Gagal memilih foto');
        } finally {
            setLoading(false);
        }
    };

    const removePhoto = () => {
        onPhotoChange(null);
    };

    if (photoUri) {
        return (
            <View style={styles.previewContainer}>
                <Text style={styles.label}>Foto Bukti</Text>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: photoUri }} style={styles.preview} />
                    <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: colors.error }]}
                        onPress={removePhoto}
                    >
                        <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Foto Bukti (Opsional)</Text>
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, { borderColor: accentColor }]}
                    onPress={takePhoto}
                    disabled={loading}
                >
                    <Camera size={20} color={accentColor} />
                    <Text style={[styles.buttonText, { color: accentColor }]}>Kamera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { borderColor: accentColor }]}
                    onPress={pickFromGallery}
                    disabled={loading}
                >
                    <ImageIcon size={20} color={accentColor} />
                    <Text style={[styles.buttonText, { color: accentColor }]}>Galeri</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    previewContainer: {
        marginTop: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: colors.surface,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    imageWrapper: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: colors.slate[200],
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
