/**
 * OnboardingScreen — Animated 5-step wizard.
 * Steps: Destination → Days → Accommodation → Budget → Interests
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { Routes } from '../navigation/AppNavigator';
import { useTrip } from '../context/TripContext';

const { width: W } = Dimensions.get('window');

// ─── Static options ────────────────────────────────────────────────────────

const ACCOMMODATION_OPTIONS = [
  { id: 'caravan', label: 'Karavan', emoji: '🚐', desc: 'Kamping & su noktaları öncelikli', bg: '#E8F5E9', color: Colors.caravan },
  { id: 'camping', label: 'Çadır',   emoji: '⛺', desc: 'Doğa & ücretsiz alanlar',          bg: '#E0F2F1', color: Colors.camping },
  { id: 'hotel',   label: 'Otel',    emoji: '🏨', desc: 'Şehir merkezi & butik oteller',    bg: '#FFF8E1', color: Colors.hotel   },
];

const BUDGET_OPTIONS = [
  { id: 'ekonomik', label: 'Ekonomik', emoji: '💚', desc: 'Ücretsiz alanlar & yerel lezzet', color: Colors.budgetEkonomik, bg: '#E8F5E9', border: '#A5D6A7' },
  { id: 'standart', label: 'Standart', emoji: '✨', desc: 'Konfor & tasarruf dengesi',        color: Colors.budgetStandart, bg: '#FFF8E1', border: '#FFE082' },
  { id: 'lux',      label: 'Lüks',    emoji: '👑', desc: 'Glamping, fine dining & VIP',      color: Colors.budgetLux,      bg: '#FBE9E7', border: '#FFAB91' },
];

const INTEREST_OPTIONS = [
  { id: 'dogal',      label: '🌿 Doğal Alanlar' },
  { id: 'tarih',      label: '🏛️ Tarih & Kültür' },
  { id: 'gastronomi', label: '🍽️ Gastronomi' },
  { id: 'macera',     label: '⚡ Macera Sporları' },
  { id: 'huzur',      label: '🧘 Huzur & Meditasyon' },
  { id: 'fotograf',   label: '📸 Fotoğrafçılık' },
];

const DAY_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 14];

const STEPS = [
  { key: 'destination', title: 'Nereye?',       subtitle: 'Şehir, bölge veya ülke gir', emoji: '🌍' },
  { key: 'days',        title: 'Kaç gün?',      subtitle: 'Toplam seyahat süren',        emoji: '📅' },
  { key: 'accom',       title: 'Konaklama',     subtitle: 'Seyahat stilini seç',         emoji: '🏕️' },
  { key: 'budget',      title: 'Bütçe',         subtitle: 'Harcama tercihini belirle',   emoji: '💰' },
  { key: 'interests',   title: 'İlgi Alanları', subtitle: 'Birden fazla seçebilirsin',   emoji: '✨' },
];

// ─── Step Content Components ───────────────────────────────────────────────

function StepDestination({ value, onChange }) {
  return (
    <View style={sStyles.stepContent}>
      <View style={[sStyles.inputWrapper, Shadow.sm]}>
        <Text style={sStyles.inputEmoji}>📍</Text>
        <TextInput
          style={sStyles.input}
          placeholder="Kapadokya, Bodrum, Paris..."
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChange}
          autoFocus
          returnKeyType="done"
          autoCorrect={false}
        />
      </View>
      <View style={sStyles.suggestions}>
        {['Kapadokya', 'Bodrum', 'İstanbul', 'Antalya', 'Pamukkale', 'Rize'].map((s) => (
          <TouchableOpacity key={s} style={sStyles.suggestionChip} onPress={() => onChange(s)} activeOpacity={0.75}>
            <Text style={sStyles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepDays({ value, onChange }) {
  return (
    <View style={sStyles.stepContent}>
      <View style={sStyles.selectedDayBox}>
        <Text style={sStyles.selectedDayNum}>{value}</Text>
        <Text style={sStyles.selectedDayLabel}>gün</Text>
      </View>
      <View style={sStyles.daysGrid}>
        {DAY_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[sStyles.dayBtn, value === d && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
            onPress={() => onChange(d)}
            activeOpacity={0.8}
          >
            <Text style={[sStyles.dayBtnText, value === d && { color: '#FFF', fontWeight: '700' }]}>{d}g</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepAccommodation({ value, onChange }) {
  return (
    <View style={[sStyles.stepContent, { gap: Spacing.sm }]}>
      {ACCOMMODATION_OPTIONS.map((opt) => {
        const sel = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[sStyles.accomCard, { backgroundColor: opt.bg }, sel && { borderColor: opt.color, borderWidth: 2.5, ...Shadow.sm }]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={sStyles.accomEmoji}>{opt.emoji}</Text>
            <View style={sStyles.accomText}>
              <Text style={[sStyles.accomLabel, sel && { color: opt.color }]}>{opt.label}</Text>
              <Text style={sStyles.accomDesc}>{opt.desc}</Text>
            </View>
            <View style={[sStyles.radio, { borderColor: opt.color }, sel && { backgroundColor: opt.color }]}>
              {sel && <View style={sStyles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StepBudget({ value, onChange }) {
  return (
    <View style={[sStyles.stepContent, { gap: Spacing.sm }]}>
      {BUDGET_OPTIONS.map((opt) => {
        const sel = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[sStyles.budgetCard, { backgroundColor: opt.bg, borderColor: sel ? opt.color : opt.border }, sel && Shadow.sm]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={sStyles.budgetEmoji}>{opt.emoji}</Text>
            <View style={sStyles.budgetText}>
              <Text style={[sStyles.budgetLabel, { color: opt.color }]}>{opt.label}</Text>
              <Text style={sStyles.budgetDesc}>{opt.desc}</Text>
            </View>
            <View style={[sStyles.radio, { borderColor: opt.color }, sel && { backgroundColor: opt.color }]}>
              {sel && <View style={sStyles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StepInterests({ value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((i) => i !== id) : [...value, id]);
  return (
    <View style={sStyles.stepContent}>
      <View style={sStyles.chipsWrap}>
        {INTEREST_OPTIONS.map((opt) => {
          const sel = value.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[sStyles.interestChip, sel && { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary }]}
              onPress={() => toggle(opt.id)}
              activeOpacity={0.75}
            >
              <Text style={[sStyles.interestText, sel && { color: Colors.primary, fontWeight: '600' }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {value.length === 0 && <Text style={sStyles.skipHint}>Atlamak istersen devam et →</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const { startTrip } = useTrip();
  const [stepIndex, setStepIndex] = useState(0);
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [accommodation, setAccommodation] = useState('caravan');
  const [budget, setBudget] = useState('standart');
  const [interests, setInterests] = useState([]);

  const slideX  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animate = useCallback((exitDir, cb) => {
    Animated.parallel([
      Animated.timing(slideX,  { toValue: exitDir * -W * 0.35, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideX.setValue(exitDir * W * 0.35);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideX,  { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const canProceed = stepIndex === 0 ? destination.trim().length > 0 : true;
  const isLast = stepIndex === STEPS.length - 1;

  const goNext = useCallback(() => {
    if (!canProceed) return;
    if (!isLast) {
      animate(1, () => setStepIndex((i) => i + 1));
    } else {
      startTrip({ destination: destination.trim(), days, accommodationType: accommodation, budget, interests });
      navigation.navigate(Routes.MAIN);
    }
  }, [canProceed, isLast, destination, days, accommodation, budget, interests, stepIndex]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) animate(-1, () => setStepIndex((i) => i - 1));
  }, [stepIndex]);

  const step = STEPS[stepIndex];

  const renderContent = () => {
    switch (step.key) {
      case 'destination': return <StepDestination value={destination} onChange={setDestination} />;
      case 'days':        return <StepDays        value={days}        onChange={setDays} />;
      case 'accom':       return <StepAccommodation value={accommodation} onChange={setAccommodation} />;
      case 'budget':      return <StepBudget      value={budget}      onChange={setBudget} />;
      case 'interests':   return <StepInterests   value={interests}   onChange={setInterests} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{stepIndex + 1}/{STEPS.length}</Text>
        </View>

        {/* Step header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{step.emoji}</Text>
          <Text style={styles.headerTitle}>{step.title}</Text>
          <Text style={styles.headerSub}>{step.subtitle}</Text>
        </View>

        {/* Animated body */}
        <Animated.View style={[styles.body, { transform: [{ translateX: slideX }], opacity }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {renderContent()}
          </ScrollView>
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8} disabled={stepIndex === 0}>
            <Text style={[styles.backText, stepIndex === 0 && { opacity: 0 }]}>← Geri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
            onPress={goNext}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>{isLast ? 'Rotamı Oluştur ✨' : 'İleri →'}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.bold,
  },

  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  headerEmoji: { fontSize: 52, marginBottom: Spacing.xs },
  headerTitle: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: Typography.size.base,
    color: Colors.textTertiary,
  },

  body: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  backBtn: {
    height: 52,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  nextBtn: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});

const sStyles = StyleSheet.create({
  stepContent: { gap: Spacing.md },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inputEmoji: { fontSize: 20 },
  input: {
    flex: 1,
    height: 56,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestionChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: { fontSize: Typography.size.sm, color: Colors.textSecondary },

  selectedDayBox: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryFaded,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
  },
  selectedDayNum: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    lineHeight: 52,
  },
  selectedDayLabel: { fontSize: Typography.size.base, color: Colors.primary, fontWeight: Typography.weight.medium },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  dayBtn: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnText: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.textSecondary },

  accomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  accomEmoji: { fontSize: 32 },
  accomText: { flex: 1 },
  accomLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  accomDesc: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },

  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  budgetEmoji: { fontSize: 30 },
  budgetText: { flex: 1 },
  budgetLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  budgetDesc: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  interestChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  interestText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  skipHint: { textAlign: 'center', fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: Spacing.md },
});
