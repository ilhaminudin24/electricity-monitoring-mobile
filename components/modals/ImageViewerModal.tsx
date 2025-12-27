/**
 * ImageViewerModal Component
 * Full-screen image viewer with zoom support
 */

import React, { useState } from 'react';
import {
    Modal,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Text,
    StatusBar,
} from 'react-native';
import { colors } from '@/constants/colors';
import { X, ZoomIn, ZoomOut } from 'lucide-react-native';

interface ImageViewerModalProps {
    visible: boolean;
    imageUrl: string;
    onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageViewerModal({
    visible,
    imageUrl,
    onClose,
}: ImageViewerModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [scale, setScale] = useState(1);

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.5, 0.5));
    };

    const handleLoadStart = () => {
        setIsLoading(true);
        setHasError(false);
    };

    const handleLoadEnd = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleClose = () => {
        setScale(1);
        setIsLoading(true);
        setHasError(false);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <StatusBar backgroundColor="rgba(0, 0, 0, 0.95)" barStyle="light-content" />
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <X size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Image Container */}
                <View style={styles.imageContainer}>
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="white" />
                            <Text style={styles.loadingText}>Memuat gambar...</Text>
                        </View>
                    )}

                    {hasError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorIcon}>📷</Text>
                            <Text style={styles.errorText}>Gagal memuat gambar</Text>
                        </View>
                    ) : (
                        <Image
                            source={{ uri: imageUrl }}
                            style={[
                                styles.image,
                                { transform: [{ scale }] }
                            ]}
                            resizeMode="contain"
                            onLoadStart={handleLoadStart}
                            onLoadEnd={handleLoadEnd}
                            onError={handleError}
                        />
                    )}
                </View>

                {/* Zoom Controls */}
                {!hasError && (
                    <View style={styles.zoomControls}>
                        <TouchableOpacity
                            style={styles.zoomButton}
                            onPress={handleZoomOut}
                            disabled={scale <= 0.5}
                        >
                            <ZoomOut size={20} color={scale <= 0.5 ? colors.slate[500] : 'white'} />
                        </TouchableOpacity>

                        <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>

                        <TouchableOpacity
                            style={styles.zoomButton}
                            onPress={handleZoomIn}
                            disabled={scale >= 3}
                        >
                            <ZoomIn size={20} color={scale >= 3 ? colors.slate[500] : 'white'} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
    },
    loadingContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: 'white',
    },
    errorContainer: {
        alignItems: 'center',
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: colors.slate[400],
    },
    zoomControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 48,
        gap: 16,
    },
    zoomButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomText: {
        fontSize: 14,
        color: 'white',
        minWidth: 50,
        textAlign: 'center',
    },
});
