import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
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
            <View className="mt-4">
                <Text className="text-sm font-medium text-slate-800 mb-2">Foto Bukti</Text>
                <View className="relative rounded-xl overflow-hidden">
                    <Image
                        source={{ uri: photoUri }}
                        className="w-full h-[200px] rounded-xl bg-slate-200"
                    />
                    <TouchableOpacity
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-error items-center justify-center"
                        onPress={removePhoto}
                    >
                        <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="mt-4">
            <Text className="text-sm font-medium text-slate-800 mb-2">Foto Bukti (Opsional)</Text>
            <View className="flex-row gap-3">
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 py-3.5 border-2 border-dashed rounded-xl bg-surface"
                    style={{ borderColor: accentColor }}
                    onPress={takePhoto}
                    disabled={loading}
                >
                    <Camera size={20} color={accentColor} />
                    <Text className="text-sm font-semibold" style={{ color: accentColor }}>
                        Kamera
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 py-3.5 border-2 border-dashed rounded-xl bg-surface"
                    style={{ borderColor: accentColor }}
                    onPress={pickFromGallery}
                    disabled={loading}
                >
                    <ImageIcon size={20} color={accentColor} />
                    <Text className="text-sm font-semibold" style={{ color: accentColor }}>
                        Galeri
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
