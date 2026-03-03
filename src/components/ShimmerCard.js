import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

export default function ShimmerCard({ width = '100%', height = 100, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { width, height, opacity },
        style,
      ]}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.border, COLORS.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function ShimmerPlayerCard() {
  return (
    <View style={styles.playerCard}>
      <ShimmerCard width={48} height={48} style={{ borderRadius: BORDER_RADIUS.full }} />
      <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
        <ShimmerCard width="60%" height={14} style={{ borderRadius: BORDER_RADIUS.sm }} />
        <ShimmerCard width="40%" height={10} style={{ borderRadius: BORDER_RADIUS.sm }} />
        <ShimmerCard width="50%" height={10} style={{ borderRadius: BORDER_RADIUS.sm }} />
      </View>
      <ShimmerCard width={64} height={32} style={{ borderRadius: BORDER_RADIUS.sm }} />
    </View>
  );
}

ShimmerCard.PlayerCard = ShimmerPlayerCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
