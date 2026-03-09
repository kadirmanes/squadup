import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { signInWithGoogle, continueAsGuest, isSigningIn } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Arka plan glow */}
      <View style={styles.glowSpot1} />
      <View style={styles.glowSpot2} />

      <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
        {/* Logo bölümü */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={['#00FFD1', '#0094FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hexOuter}
          >
            <View style={styles.hexInner}>
              <LinearGradient
                colors={['#00FFD1', '#0094FF']}
                style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
              />
              <Text style={styles.hexIcon}>⚔️</Text>
            </View>
          </LinearGradient>

          <View style={styles.titleRow}>
            <Text style={styles.titleSquad}>SQUAD</Text>
            <LinearGradient colors={['#00FFD1', '#0094FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.titleUp}>UP</Text>
            </LinearGradient>
          </View>

          <Text style={styles.tagline}>FIND YOUR SQUAD. DOMINATE TOGETHER.</Text>
        </Animated.View>

        {/* Özellik listesi */}
        <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
          {[
            { icon: '🎯', text: '10 farklı oyun için takım bul' },
            { icon: '⚡', text: 'Rank, server ve vibe\'ına göre eşleş' },
            { icon: '💬', text: 'Maç sonrası direkt sohbet et' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Giriş butonları */}
        <Animated.View style={[styles.buttons, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Google Sign-In */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={signInWithGoogle}
            disabled={isSigningIn}
            style={styles.googleBtn}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <>
                <Text style={styles.googleLogo}>G</Text>
                <Text style={styles.googleBtnText}>Google ile Giriş Yap</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Misafir seçeneği */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={continueAsGuest}
            disabled={isSigningIn}
            style={styles.guestBtn}
          >
            <Text style={styles.guestBtnText}>Misafir olarak devam et</Text>
          </TouchableOpacity>

          <Text style={styles.guestWarning}>
            ⚠️ Misafir hesabı cihazla bağlıdır — uygulama silinirse kaybolur
          </Text>
        </Animated.View>

        {/* Alt bilgi */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            Giriş yaparak{' '}
            <Text style={styles.footerLink}>Kullanım Koşulları</Text>
            {' '}ve{' '}
            <Text style={styles.footerLink}>Gizlilik Politikası</Text>
            {'\'nı kabul etmiş olursunuz.'}
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  glowSpot1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -100,
    left: -80,
    backgroundColor: 'rgba(0,255,209,0.05)',
  },
  glowSpot2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -80,
    right: -60,
    backgroundColor: 'rgba(0,148,255,0.05)',
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },

  // Logo
  logoSection: { alignItems: 'center', gap: SPACING.md, paddingTop: SPACING.xl },
  hexOuter: {
    width: 90,
    height: 90,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    padding: 2.5,
  },
  hexInner: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hexIcon: { fontSize: 36, transform: [{ rotate: '-45deg' }] },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  titleSquad: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 38,
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  titleUp: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 38,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  // Özellikler
  features: {
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: { fontSize: 20 },
  featureText: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Butonlar
  buttons: { gap: SPACING.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  googleLogo: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 18,
    color: '#4285F4',
    letterSpacing: 0,
  },
  googleBtnText: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 17,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  guestBtnText: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  guestWarning: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Footer
  footer: { alignItems: 'center' },
  footerText: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
