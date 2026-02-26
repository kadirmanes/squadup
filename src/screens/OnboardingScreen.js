import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { Routes } from '../navigation/AppNavigator';
import { useTrip } from '../context/TripContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Static Data ──────────────────────────────────────────────────────────────

const ACCOMMODATION_OPTIONS = [
  {
    id: 'caravan',
    label: 'Karavan',
    emoji: '🚐',
    description: 'Özgür yol, kamping alanları,\nsu noktaları öncelikli',
    gradient: Colors.caravan,
    bg: '#E8F5E9',
  },
  {
    id: 'camping',
    label: 'Çadır',
    emoji: '⛺',
    description: 'Doğanın kalbinde,\nücretsiz alanlara odaklı',
    gradient: Colors.camping,
    bg: '#E0F2F1',
  },
  {
    id: 'hotel',
    label: 'Otel',
    emoji: '🏨',
    description: 'Şehir merkezi, butik oteller\nve konfor öncelikli',
    gradient: Colors.hotel,
    bg: '#FFF8E1',
  },
];

const BUDGET_OPTIONS = [
  {
    id: 'ekonomik',
    label: 'Ekonomik',
    emoji: '💚',
    description: 'Ücretsiz alanlar, yerel lezzet,\nakıllı bütçe',
    color: Colors.budgetEkonomik,
    bg: '#E8F5E9',
    border: '#A5D6A7',
  },
  {
    id: 'standart',
    label: 'Standart',
    emoji: '✨',
    description: 'Konfor ve tasarruf\narasında denge',
    color: Colors.budgetStandart,
    bg: '#FFF8E1',
    border: '#FFE082',
  },
  {
    id: 'lux',
    label: 'Lüks',
    emoji: '👑',
    description: 'Glamping, özel plajlar,\nfine dining',
    color: Colors.budgetLux,
    bg: '#FBE9E7',
    border: '#FFAB91',
  },
];

const INTEREST_OPTIONS = [
  { id: 'dogal', label: '🌿 Doğal Alanlar' },
  { id: 'tarih', label: '🏛️ Tarih & Kültür' },
  { id: 'gastronomi', label: '🍽️ Gastronomi' },
  { id: 'macera', label: '⚡ Macera Sporu' },
  { id: 'huzur', label: '🧘 Huzur & Meditasyon' },
  { id: 'fotograf', label: '📸 Fotoğrafçılık' },
];

const DAY_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 14];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ step, title, subtitle }) {
  return (
    <View style={sStyles.sectionLabel}>
      <View style={sStyles.stepBadge}>
        <Text style={sStyles.stepText}>{step}</Text>
      </View>
      <View>
        <Text style={sStyles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={sStyles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function AccommodationCard({ option, selected, onSelect }) {
  const isSelected = selected === option.id;
  return (
    <TouchableOpacity
      style={[
        sStyles.accommodationCard,
        { backgroundColor: option.bg },
        isSelected && {
          borderColor: option.gradient,
          borderWidth: 2,
          ...Shadow.md,
        },
      ]}
      onPress={() => onSelect(option.id)}
      activeOpacity={0.8}
    >
      <Text style={sStyles.accommodationEmoji}>{option.emoji}</Text>
      <Text style={[sStyles.accommodationLabel, isSelected && { color: option.gradient }]}>
        {option.label}
      </Text>
      <Text style={sStyles.accommodationDesc}>{option.description}</Text>
      {isSelected && (
        <View style={[sStyles.selectedDot, { backgroundColor: option.gradient }]} />
      )}
    </TouchableOpacity>
  );
}

function BudgetCard({ option, selected, onSelect }) {
  const isSelected = selected === option.id;
  return (
    <TouchableOpacity
      style={[
        sStyles.budgetCard,
        { backgroundColor: option.bg, borderColor: isSelected ? option.color : option.border },
        isSelected && Shadow.sm,
      ]}
      onPress={() => onSelect(option.id)}
      activeOpacity={0.8}
    >
      <View style={sStyles.budgetCardLeft}>
        <Text style={sStyles.budgetEmoji}>{option.emoji}</Text>
        <View>
          <Text style={[sStyles.budgetLabel, { color: option.color }]}>{option.label}</Text>
          <Text style={sStyles.budgetDesc}>{option.description}</Text>
        </View>
      </View>
      <View
        style={[
          sStyles.budgetRadio,
          { borderColor: option.color },
          isSelected && { backgroundColor: option.color },
        ]}
      >
        {isSelected && <View style={sStyles.budgetRadioInner} />}
      </View>
    </TouchableOpacity>
  );
}

function InterestChip({ option, selected, onToggle }) {
  const isSelected = selected.includes(option.id);
  return (
    <TouchableOpacity
      style={[
        sStyles.chip,
        isSelected && { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
      ]}
      onPress={() => onToggle(option.id)}
      activeOpacity={0.75}
    >
      <Text style={[sStyles.chipText, isSelected && { color: Colors.primary, fontWeight: '600' }]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const { startTrip } = useTrip();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [accommodation, setAccommodation] = useState('caravan');
  const [budget, setBudget] = useState('standart');
  const [interests, setInterests] = useState([]);

  const destinationRef = useRef(null);

  const toggleInterest = (id) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const canProceed = destination.trim().length > 0 && days > 0;

  const handleStart = () => {
    if (!canProceed) return;
    startTrip({
      destination: destination.trim(),
      days,
      accommodationType: accommodation,
      budget,
      interests,
    });
    navigation.navigate(Routes.MAIN);
  };

  return (
    <SafeAreaView style={sStyles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={sStyles.scroll}
          contentContainerStyle={sStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Header */}
          <View style={sStyles.hero}>
            <Text style={sStyles.heroEmoji}>🧭</Text>
            <Text style={sStyles.heroTitle}>NomadWise AI</Text>
            <Text style={sStyles.heroSubtitle}>
              Seyahatini AI ile planla.{'\n'}Her detay, senin stiline göre.
            </Text>
          </View>

          {/* Step 1 — Destination */}
          <View style={sStyles.section}>
            <SectionLabel step="1" title="Nereye gidiyorsun?" />
            <View style={[sStyles.inputWrapper, Shadow.sm]}>
              <Text style={sStyles.inputIcon}>📍</Text>
              <TextInput
                ref={destinationRef}
                style={sStyles.input}
                placeholder="Kapadokya, Bodrum, Patagonia..."
                placeholderTextColor={Colors.textTertiary}
                value={destination}
                onChangeText={setDestination}
                returnKeyType="done"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Step 2 — Days */}
          <View style={sStyles.section}>
            <SectionLabel
              step="2"
              title="Kaç gün?"
              subtitle={`Seçilen: ${days} gün`}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={sStyles.daysRow}
            >
              {DAY_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    sStyles.dayChip,
                    days === d && {
                      backgroundColor: Colors.primary,
                      borderColor: Colors.primary,
                    },
                  ]}
                  onPress={() => setDays(d)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      sStyles.dayChipText,
                      days === d && { color: '#FFFFFF', fontWeight: '700' },
                    ]}
                  >
                    {d}g
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Step 3 — Accommodation */}
          <View style={sStyles.section}>
            <SectionLabel
              step="3"
              title="Konaklama tipi?"
              subtitle="Seyahat stiline uygun rota oluşturulur"
            />
            <View style={sStyles.accommodationRow}>
              {ACCOMMODATION_OPTIONS.map((opt) => (
                <AccommodationCard
                  key={opt.id}
                  option={opt}
                  selected={accommodation}
                  onSelect={setAccommodation}
                />
              ))}
            </View>
          </View>

          {/* Step 4 — Budget */}
          <View style={sStyles.section}>
            <SectionLabel
              step="4"
              title="Bütçe tercihin?"
              subtitle="Rota önerileri buna göre kişiselleşir"
            />
            <View style={sStyles.budgetList}>
              {BUDGET_OPTIONS.map((opt) => (
                <BudgetCard
                  key={opt.id}
                  option={opt}
                  selected={budget}
                  onSelect={setBudget}
                />
              ))}
            </View>
          </View>

          {/* Step 5 — Interests */}
          <View style={sStyles.section}>
            <SectionLabel
              step="5"
              title="İlgi alanların?"
              subtitle="Birden fazla seçebilirsin"
            />
            <View style={sStyles.chipsWrap}>
              {INTEREST_OPTIONS.map((opt) => (
                <InterestChip
                  key={opt.id}
                  option={opt}
                  selected={interests}
                  onToggle={toggleInterest}
                />
              ))}
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[
              sStyles.ctaButton,
              !canProceed && sStyles.ctaDisabled,
            ]}
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={!canProceed}
          >
            <Text style={sStyles.ctaText}>Rotamı Oluştur ✨</Text>
          </TouchableOpacity>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  heroEmoji: {
    fontSize: 52,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.xs,
  },

  // Section
  section: {
    marginBottom: Spacing.lg + 4,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm + 4,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },

  // Days
  daysRow: {
    paddingHorizontal: 2,
    gap: Spacing.sm,
  },
  dayChip: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },

  // Accommodation
  accommodationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  accommodationCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.sm + 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  accommodationEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  accommodationLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  accommodationDesc: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Budget
  budgetList: {
    gap: Spacing.sm,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  budgetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  budgetEmoji: {
    fontSize: 26,
  },
  budgetLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  budgetDesc: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  budgetRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  // Interests
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },

  // CTA
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadow.md,
  },
  ctaDisabled: {
    backgroundColor: Colors.border,
    ...Shadow.sm,
  },
  ctaText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
