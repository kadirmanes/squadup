/**
 * GeneratingScreen — shown while Claude AI builds the travel plan.
 *
 * Receives `preferences` via navigation params, calls the AI service,
 * then navigates to MAIN on success or shows an error (with API key
 * entry) on failure.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { Routes } from '../navigation/routes';
import { useTrip } from '../context/TripContext';
import { generateAIRoute, getApiKey, saveApiKey, API_KEY_STORAGE } from '../services/aiRoute';

const STEPS = [
  'Güzergah analiz ediliyor...',
  'Şehirler ve mekanlar seçiliyor...',
  'Konaklama yerleri belirleniyor...',
  'Aktiviteler kişiselleştiriliyor...',
  'Plan tamamlanıyor...',
];

// ─── Animated dot loader ──────────────────────────────────────────────────

function DotLoader() {
  const dots = [0, 1, 2].map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(400),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={dotStyles.row}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[dotStyles.dot, {
            opacity: dot,
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
          }]}
        />
      ))}
    </View>
  );
}

// ─── Route preview animation ──────────────────────────────────────────────

function RouteAnimation({ startLocation, destination }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pinScale  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.spring(pinScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    // Loop the line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 2200, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View style={routeAnim.container}>
      <View style={routeAnim.startPin}>
        <Text style={routeAnim.pinEmoji}>🚩</Text>
        <Text style={routeAnim.pinLabel} numberOfLines={1}>{startLocation}</Text>
      </View>

      <View style={routeAnim.lineWrap}>
        <View style={routeAnim.lineTrack} />
        <Animated.View
          style={[routeAnim.lineFill, {
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}
        />
        {/* Moving car/tent dot */}
        <Animated.View
          style={[routeAnim.movingDot, {
            left: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '96%'] }),
          }]}
        />
      </View>

      <Animated.View style={[routeAnim.endPin, { transform: [{ scale: pinScale }] }]}>
        <Text style={routeAnim.pinEmoji}>🏁</Text>
        <Text style={routeAnim.pinLabel} numberOfLines={1}>{destination}</Text>
      </Animated.View>
    </View>
  );
}

// ─── API Key entry form ───────────────────────────────────────────────────

function ApiKeyForm({ onSubmit, loading }) {
  const [key, setKey] = useState('');
  return (
    <View style={keyStyles.wrap}>
      <Text style={keyStyles.title}>🔑 Anthropic API Anahtarı</Text>
      <Text style={keyStyles.desc}>
        Yapay zeka özelliği için kendi API anahtarını gir.{'\n'}
        console.anthropic.com adresinden ücretsiz alabilirsin.
      </Text>
      <TextInput
        style={keyStyles.input}
        placeholder="sk-ant-api03-..."
        placeholderTextColor={Colors.textTertiary}
        value={key}
        onChangeText={setKey}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <TouchableOpacity
        style={[keyStyles.btn, (!key.trim() || loading) && { opacity: 0.5 }]}
        onPress={() => key.trim() && onSubmit(key.trim())}
        disabled={!key.trim() || loading}
        activeOpacity={0.85}
      >
        <Text style={keyStyles.btnText}>{loading ? 'Deneniyor...' : 'Rotamı Oluştur ✨'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function GeneratingScreen({ navigation, route }) {
  const { preferences } = route.params || {};
  const { setTripFromAI } = useTrip();

  const [phase,    setPhase]    = useState('generating'); // generating | error | key_needed
  const [status,   setStatus]   = useState(STEPS[0]);
  const [stepIdx,  setStepIdx]  = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    run();
  }, []);

  // Cycle through step labels while generating
  useEffect(() => {
    if (phase !== 'generating') return;
    const t = setInterval(() => {
      setStepIdx((i) => {
        const next = (i + 1) % STEPS.length;
        setStatus(STEPS[next]);
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, [phase]);

  const run = useCallback(async (overrideKey) => {
    try {
      setPhase('generating');
      const apiKey = overrideKey || await getApiKey();
      if (!apiKey) { setPhase('key_needed'); return; }

      const result = await generateAIRoute(
        preferences,
        apiKey,
        (msg) => setStatus(msg),
      );

      setTripFromAI(preferences, result);
      navigation.replace(Routes.MAIN);
    } catch (err) {
      if (err.message === 'API_KEY_MISSING' || err.message === 'API_KEY_INVALID') {
        setPhase('key_needed');
      } else {
        setPhase('error');
        setErrorMsg(err.message || 'Bilinmeyen hata');
      }
    }
  }, [preferences]);

  const handleKeySubmit = async (key) => {
    setKeyLoading(true);
    await saveApiKey(key);
    setKeyLoading(false);
    run(key);
  };

  const handleRetry = () => run();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {/* ── Generating phase ── */}
        {phase === 'generating' && (
          <View style={styles.center}>
            <Text style={styles.aiLabel}>✨ AI Rota Oluşturucu</Text>
            <RouteAnimation
              startLocation={preferences?.startLocation || 'Başlangıç'}
              destination={preferences?.destination || 'Hedef'}
            />
            <Text style={styles.statusText}>{status}</Text>
            <DotLoader />
            <Text style={styles.hint}>
              Claude AI şehirleri, gerçek mekanları ve{'\n'}
              konaklama yerlerini seçiyor...
            </Text>
          </View>
        )}

        {/* ── API key needed ── */}
        {phase === 'key_needed' && (
          <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Text style={styles.aiLabel}>✨ AI Rota Oluşturucu</Text>
              <ApiKeyForm onSubmit={handleKeySubmit} loading={keyLoading} />
            </KeyboardAvoidingView>
          </ScrollView>
        )}

        {/* ── Error phase ── */}
        {phase === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorTitle}>Bir sorun oluştu</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.offlineBtn}
              onPress={() => {
                // Use offline mock generator
                const { generateRoute } = require('../utils/routeGenerator');
                const result = generateRoute(preferences);
                setTripFromAI(preferences, result);
                navigation.replace(Routes.MAIN);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.offlineText}>Çevrimdışı Modda Devam Et</Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryDark },
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  aiLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primaryLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  hint: {
    fontSize: Typography.size.sm,
    color: Colors.primaryLight,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  errorEmoji: { fontSize: 56 },
  errorTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
  errorMsg:   { fontSize: Typography.size.sm, color: Colors.primaryLight, textAlign: 'center', opacity: 0.8 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  retryText: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
  offlineBtn: { paddingVertical: Spacing.sm },
  offlineText: { fontSize: Typography.size.sm, color: Colors.primaryLight, textDecorationLine: 'underline' },
});

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primaryLight },
});

const routeAnim = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  startPin:  { alignItems: 'center', width: 64 },
  endPin:    { alignItems: 'center', width: 64 },
  pinEmoji:  { fontSize: 28 },
  pinLabel:  { fontSize: 10, color: Colors.primaryLight, textAlign: 'center', marginTop: 2, fontWeight: '600' },
  lineWrap:  { flex: 1, height: 8, position: 'relative', justifyContent: 'center' },
  lineTrack: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: Colors.primaryLight + '40', borderRadius: 2 },
  lineFill:  { position: 'absolute', left: 0, height: 3, backgroundColor: Colors.primaryLight, borderRadius: 2 },
  movingDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', top: -4, ...Shadow.sm },
});

const keyStyles = StyleSheet.create({
  wrap:  { width: '100%', gap: Spacing.md, alignItems: 'center' },
  title: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
  desc:  { fontSize: Typography.size.sm, color: Colors.primaryLight, textAlign: 'center', lineHeight: 22, opacity: 0.85 },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.base,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  btnText: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
});
