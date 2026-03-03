/**
 * GeneratingScreen — 2-phase AI route generation.
 *
 * Phase 1 (generating_cities): quick call → city list
 * Phase 2 (city_selection):    user reviews & deselects cities
 * Phase 3 (generating_route):  full route with selected cities
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
import { generateAIRoute, generateCityList, getApiKey, saveApiKey, API_KEY_STORAGE } from '../services/aiRoute';
import { fetchWeatherForCities, getWeatherWarnings } from '../services/weatherService';
import { getWeatherApiKey } from '../utils/storage';

const STEPS = [
  'Güzergah analiz ediliyor...',
  'Şehirler ve mekanlar seçiliyor...',
  'Konaklama alternatifleri oluşturuluyor...',
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

// ─── City Selection phase ─────────────────────────────────────────────────

function CitySelection({ cities, selectedCities, onToggle, onConfirm, preferences }) {
  const overnightCount = cities.filter((c) => !c.isStopover && selectedCities.has(c.name)).length;
  return (
    <ScrollView contentContainerStyle={cityStyles.container} showsVerticalScrollIndicator={false}>
      <Text style={cityStyles.title}>🗺️ Güzergah Şehirleri</Text>
      <Text style={cityStyles.subtitle}>
        {preferences?.startLocation} → {preferences?.destination}
      </Text>
      <Text style={cityStyles.hint}>
        🌙 geceleme · ⚡ kısa geçiş · İstemediğin şehirlerin işaretini kaldır
      </Text>

      <View style={cityStyles.chipsWrap}>
        {cities.map((city, idx) => {
          const selected = selectedCities.has(city.name);
          return (
            <TouchableOpacity
              key={city.name}
              style={[
                cityStyles.chip,
                city.isStopover && cityStyles.chipStopover,
                selected && (city.isStopover ? cityStyles.chipStopoverSel : cityStyles.chipSelected),
              ]}
              onPress={() => onToggle(city.name)}
              activeOpacity={0.75}
            >
              <Text style={[cityStyles.chipNum, selected && cityStyles.chipNumSel]}>
                {selected ? '✓' : idx + 1}
              </Text>
              <Text style={[cityStyles.chipText, selected && cityStyles.chipTextSel]}>
                {city.isStopover ? `⚡ ${city.name}` : `🌙 ${city.name}`}
              </Text>
              <Text style={[cityStyles.chipDuration, selected && cityStyles.chipDurationSel]}>
                {city.hours < 5 ? `~${city.hours}h` : `${city.hours}h`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={cityStyles.selectedCount}>
        {overnightCount} geceleme · {selectedCities.size} şehir seçili
      </Text>

      <TouchableOpacity
        style={[cityStyles.confirmBtn, overnightCount === 0 && { opacity: 0.4 }]}
        onPress={onConfirm}
        disabled={overnightCount === 0}
        activeOpacity={0.85}
      >
        <Text style={cityStyles.confirmBtnText}>Rotayı Oluştur ✨</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function GeneratingScreen({ navigation, route }) {
  const { preferences } = route.params || {};
  const { setTripFromAI } = useTrip();

  // phases: generating_cities | city_selection | generating_route | error | key_needed
  const [phase,         setPhase]         = useState('generating_cities');
  const [status,        setStatus]        = useState(STEPS[0]);
  const [stepIdx,       setStepIdx]       = useState(0);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [keyLoading,    setKeyLoading]    = useState(false);
  // cities: [{name, hours, isStopover}]
  const [cities,        setCities]        = useState([]);
  // dayPlan: [{day, overnightCity, stops:[{city,hours,isStopover}]}]
  const [dayPlan,       setDayPlan]       = useState([]);
  const [selectedCities, setSelectedCities] = useState(new Set());
  const [savedApiKey,   setSavedApiKey]   = useState('');

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    runPhase1();
  }, []);

  // Cycle step labels during loading phases
  useEffect(() => {
    if (phase !== 'generating_cities' && phase !== 'generating_route') return;
    const t = setInterval(() => {
      setStepIdx((i) => {
        const next = (i + 1) % STEPS.length;
        setStatus(STEPS[next]);
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, [phase]);

  // Phase 1: get city list + day plan
  const runPhase1 = useCallback(async (overrideKey) => {
    try {
      setPhase('generating_cities');
      const apiKey = overrideKey || await getApiKey();
      if (!apiKey) { setPhase('key_needed'); return; }

      const result = await generateCityList(preferences, apiKey, (msg) => setStatus(msg));
      const allCities = result?.allCities || [];
      const plan      = result?.dayPlan   || [];

      if (allCities.length > 0) {
        setSavedApiKey(apiKey);
        setCities(allCities);
        setDayPlan(plan);
        setSelectedCities(new Set(allCities.map((c) => c.name)));
        setPhase('city_selection');
      } else {
        // No cities returned — skip to full route directly
        await runPhase2(apiKey, null, null);
      }
    } catch (err) {
      console.error('[runPhase1] error:', err?.message, err);
      if (err.message === 'API_KEY_MISSING' || err.message === 'API_KEY_INVALID') {
        setPhase('key_needed');
      } else {
        setPhase('error');
        setErrorMsg(err.message || 'Bilinmeyen hata');
      }
    }
  }, [preferences]);

  // Phase 2: generate full route with selected cities + day plan
  const runPhase2 = useCallback(async (apiKey, selCities, plan) => {
    try {
      setPhase('generating_route');
      const key = apiKey || savedApiKey;
      const selectedSet = selCities instanceof Set ? selCities : null;

      // Filter the day plan to only include days where the overnight city is still selected
      const filteredPlan = plan?.length
        ? plan
            .map((d) => ({
              ...d,
              stops: d.stops.filter((s) => !selectedSet || selectedSet.has(s.city)),
            }))
            .filter((d) => !selectedSet || selectedSet.has(d.overnightCity))
        : null;

      // days = number of overnight days in the filtered plan
      const days = filteredPlan?.length || (selectedSet ? selectedSet.size : preferences.days);
      const selectedArr = selectedSet ? Array.from(selectedSet) : null;

      const prefs = {
        ...preferences,
        selectedCities: selectedArr,
        dayPlan: filteredPlan,
        days,
      };

      // Fetch weather for selected cities (optional — continues if API key not set)
      let weatherMap = {};
      try {
        const weatherKey = await getWeatherApiKey();
        if (weatherKey) {
          setStatus('Hava durumu alınıyor...');
          const citiesToFetch = selectedArr || [];
          weatherMap = await fetchWeatherForCities(citiesToFetch, weatherKey);
          const warnings = getWeatherWarnings(weatherMap);
          if (warnings.length) {
            console.log('[GeneratingScreen] Weather warnings:', warnings);
          }
        }
      } catch (weatherErr) {
        console.warn('[GeneratingScreen] Weather fetch failed (non-fatal):', weatherErr.message);
      }

      const result = await generateAIRoute({ ...prefs, weatherMap }, key, (msg) => setStatus(msg));
      setTripFromAI(preferences, result);
      navigation.replace(Routes.MAIN);
    } catch (err) {
      console.error('[runPhase2] error:', err?.message, err);
      if (err.message === 'API_KEY_MISSING' || err.message === 'API_KEY_INVALID') {
        setPhase('key_needed');
      } else {
        setPhase('error');
        setErrorMsg(err.message || 'Bilinmeyen hata');
      }
    }
  }, [preferences, savedApiKey]);

  const handleConfirmCities = useCallback(() => {
    runPhase2(savedApiKey, selectedCities, dayPlan);
  }, [savedApiKey, selectedCities, dayPlan, runPhase2]);

  const handleKeySubmit = async (key) => {
    setKeyLoading(true);
    await saveApiKey(key);
    setKeyLoading(false);
    runPhase1(key);
  };

  const handleRetry = () => runPhase1();

  const isLoading = phase === 'generating_cities' || phase === 'generating_route';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>

        {/* ── Loading phases ── */}
        {isLoading && (
          <View style={styles.center}>
            <Text style={styles.aiLabel}>✨ AI Rota Oluşturucu</Text>
            <RouteAnimation
              startLocation={preferences?.startLocation || 'Başlangıç'}
              destination={preferences?.destination || 'Hedef'}
            />
            <Text style={styles.statusText}>{status}</Text>
            <DotLoader />
            <Text style={styles.hint}>
              {phase === 'generating_cities'
                ? 'Güzergah şehirleri belirleniyor...'
                : 'Claude AI gerçek mekanları ve\nkonaklama alternatiflerini seçiyor...'}
            </Text>
          </View>
        )}

        {/* ── City selection ── */}
        {phase === 'city_selection' && (
          <CitySelection
            cities={cities}
            selectedCities={selectedCities}
            onToggle={(name) => {
              setSelectedCities((prev) => {
                const next = new Set(prev);
                if (next.has(name)) next.delete(name); else next.add(name);
                return next;
              });
            }}
            onConfirm={handleConfirmCities}
            preferences={preferences}
          />
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
  safeArea:  { flex: 1, backgroundColor: Colors.primaryDark },
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
  retryText:   { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
  offlineBtn:  { paddingVertical: Spacing.sm },
  offlineText: { fontSize: Typography.size.sm, color: Colors.primaryLight, textDecorationLine: 'underline' },
});

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primaryLight },
});

const routeAnim = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingHorizontal: Spacing.lg, gap: Spacing.sm,
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
    width: '100%', height: 56,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    fontSize: Typography.size.base, color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btn: {
    width: '100%', height: 52, backgroundColor: Colors.primary,
    borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  btnText: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
});

const cityStyles = StyleSheet.create({
  container: {
    flexGrow: 1, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  title: {
    fontSize: Typography.size.xxl, fontWeight: Typography.weight.extrabold,
    color: '#FFFFFF', textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.sm, color: Colors.primaryLight,
    textAlign: 'center', opacity: 0.9,
  },
  hint: {
    fontSize: Typography.size.sm, color: Colors.primaryLight,
    textAlign: 'center', opacity: 0.7, lineHeight: 20,
  },
  chipsWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, justifyContent: 'center', width: '100%',
    marginTop: Spacing.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
  },
  chipStopover: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipStopoverSel: {
    backgroundColor: Colors.primary + 'BB',
    borderColor: Colors.primary,
  },
  chipNum: {
    fontSize: Typography.size.xs, fontWeight: Typography.weight.bold,
    color: Colors.primaryLight, minWidth: 16, textAlign: 'center',
  },
  chipNumSel: { color: '#FFFFFF' },
  chipText: {
    fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
    color: Colors.primaryLight,
  },
  chipTextSel: { color: '#FFFFFF' },
  chipDuration: {
    fontSize: 10, color: Colors.primaryLight, opacity: 0.6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8,
  },
  chipDurationSel: { color: '#FFFFFF', opacity: 0.8 },
  selectedCount: {
    fontSize: Typography.size.sm, color: Colors.primaryLight, opacity: 0.7,
  },
  confirmBtn: {
    width: '100%', height: 56, backgroundColor: Colors.primary,
    borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.sm, ...Shadow.sm,
  },
  confirmBtnText: {
    fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF',
  },
});
