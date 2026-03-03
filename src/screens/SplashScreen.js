import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');
const HEX_SIZE = 100;

export default function SplashScreen({ navigation }) {
  const { uid, isOnboarded, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!uid) return; // Still authenticating
      if (!isOnboarded) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Main');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [uid, isOnboarded, isLoading]);

  return (
    <View style={styles.container}>
      {/* Background glow spots */}
      <View style={[styles.glowSpot, styles.glowSpot1]} />
      <View style={[styles.glowSpot, styles.glowSpot2]} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Hexagon logo */}
        <Animated.View style={[styles.hexWrapper, { opacity: glowAnim }]}>
          <LinearGradient
            colors={['#00FFD1', '#0094FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hexagonOuter}
          >
            <View style={styles.hexagonInner}>
              <LinearGradient
                colors={['#00FFD1', '#0094FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hexagonGlow}
              />
              <Text style={styles.hexIcon}>⚔️</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* App name */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleSquad}>SQUAD</Text>
          <LinearGradient
            colors={['#00FFD1', '#0094FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.titleUp}>UP</Text>
          </LinearGradient>
        </View>

        <Text style={styles.tagline}>FIND YOUR SQUAD. DOMINATE TOGETHER.</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.loadingRow, { opacity: fadeAnim }]}>
        {[0, 1, 2].map((i) => (
          <LoadingDot key={i} delay={i * 200} />
        ))}
      </Animated.View>
    </View>
  );
}

function LoadingDot({ delay }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginHorizontal: 3,
        opacity: anim,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowSpot: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowSpot1: {
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    backgroundColor: 'rgba(0,255,209,0.04)',
  },
  glowSpot2: {
    width: 250,
    height: 250,
    bottom: -60,
    right: -60,
    backgroundColor: 'rgba(0,148,255,0.04)',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 20,
  },
  hexWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonOuter: {
    width: HEX_SIZE + 4,
    height: HEX_SIZE + 4,
    borderRadius: (HEX_SIZE + 4) * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  hexagonInner: {
    width: HEX_SIZE,
    height: HEX_SIZE,
    borderRadius: HEX_SIZE * 0.14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hexagonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.08,
  },
  hexIcon: {
    fontSize: 40,
    transform: [{ rotate: '-45deg' }],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  titleSquad: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 42,
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  titleUp: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 42,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textAlign: 'center',
  },
  loadingRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
