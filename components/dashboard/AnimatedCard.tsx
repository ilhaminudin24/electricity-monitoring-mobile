import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface AnimatedCardProps extends ViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
}

export function AnimatedCard({
    children,
    delay = 0,
    duration = 300,
    style,
    ...props
}: AnimatedCardProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay, duration]);

    return (
        <Animated.View
            style={[
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
                style,
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
}
