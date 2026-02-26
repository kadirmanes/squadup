import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { PREMIUM_FEATURES } from '../utils/routeGenerator';
import BudgetTracker from '../components/BudgetTracker';
import DayCard from '../components/DayCard';
import AccommodationBadge from '../components/AccommodationBadge';
import WeatherWidget from '../components/WeatherWidget';
import { useTrip } from '../context/TripContext';
import { Routes } from '../navigation/AppNavigator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCOM_META = {
  caravan: { icon: '🚐', routeNote: 'Kamping & Su Noktaları Öncelikli', color: Colors.caravan },
  camping: { icon: '⛺', routeNote: 'Ücretsiz Doğa Alanları Öncelikli',  color: Colors.camping },
  hotel:   { icon: '🏨', routeNote: 'Şehir Merkezi & Butik Oteller',      color: Colors.hotel  },
};

const BUDGET_LABELS = { ekonomik: 'Ekonomik', standart: 'Standart', lux: 'Lüks' };

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, color }) {
  return (
    <View style={[statStyles.card, Shadow.sm]}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={[statStyles.value, color && { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function PremiumTeaser({ feature }) {
  return (
    <View style={pStyles.teaser}>
      <View style={pStyles.left}>
        <Text style={pStyles.lock}>🔒</Text>
        <View>
          <Text style={pStyles.name}>{feature.name}</Text>
          <Text style={pStyles.desc}>{feature.description}</Text>
        </View>
      </View>
      <TouchableOpacity style={pStyles.btn} activeOpacity={0.85}>
        <Text style={pStyles.btnText}>Premium</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const { preferences, tripData, resetTrip } = useTrip();

  // No trip created yet → show empty state
  if (!preferences || !tripData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧭</Text>
          <Text style={styles.emptyTitle}>Rota hazır değil</Text>
          <Text style={styles.emptySubtitle}>
            Onboarding ekranından bir seyahat planı oluştur.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate(Routes.ONBOARDING)}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyBtnText}>Rota Oluştur →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { days: dayPlans, totalBudget } = tripData;
  const accomMeta = ACCOM_META[preferences.accommodationType] || ACCOM_META.caravan;
  const budgetLabel = BUDGET_LABELS[preferences.budget] || 'Standart';
  const totalActivities = dayPlans.reduce((s, d) => s + d.activities.length, 0);

  const handleActivityPress = (activity, dayPlan) => {
    navigation.navigate(Routes.ACTIVITY_DETAIL, {
      activity,
      dayTitle: dayPlan.title,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topGreeting}>Gezi Planın 🗓️</Text>
            <Text style={styles.topDest}>{preferences.destination}</Text>
          </View>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              resetTrip();
              navigation.navigate(Routes.ONBOARDING);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.resetText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero Card ── */}
        <View style={[styles.heroCard, Shadow.md]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.destLabel}>Hedef</Text>
              <Text style={styles.destName}>{preferences.destination}</Text>
            </View>
            <Text style={styles.heroIcon}>{accomMeta.icon}</Text>
          </View>

          <View style={styles.heroBadges}>
            <AccommodationBadge type={preferences.accommodationType} size="lg" />
            <View style={styles.routeNote}>
              <Text style={styles.routeNoteText}>{accomMeta.routeNote}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.statsRow}>
            <StatCard emoji="📅" label="Gün"      value={`${preferences.days}`}  color={Colors.primary} />
            <StatCard emoji="💰" label="Bütçe"    value={budgetLabel}             color={Colors.accent} />
            <StatCard emoji="⚡" label="Aktivite" value={`${totalActivities}`}    color={Colors.secondary} />
          </View>
        </View>

        {/* ── Weather Widget ── */}
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Hava Durumu ☀️</Text>
          <Text style={styles.widgetSub}>Seyahat dönemine ait tahmin</Text>
        </View>
        <WeatherWidget destination={preferences.destination} />

        {/* ── Budget Tracker ── */}
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Bütçe Takibi</Text>
        </View>
        <BudgetTracker totalBudget={totalBudget} />

        {/* ── Timeline ── */}
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Günlük Plan</Text>
          <Text style={styles.widgetSub}>Aktiviteye dokun → Detaylar</Text>
        </View>

        {dayPlans.map((dayPlan) => (
          <DayCard
            key={dayPlan.day}
            dayPlan={dayPlan}
            isExpanded={dayPlan.day === 1}
            onActivityPress={(activity) => handleActivityPress(activity, dayPlan)}
          />
        ))}

        {/* ── Premium Teasers ── */}
        <View style={styles.widgetHeader}>
          <View style={styles.premiumRow}>
            <Text style={styles.widgetTitle}>Premium Özellikler</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>👑 Yükselt</Text>
            </View>
          </View>
        </View>
        <View style={[styles.premiumCard, Shadow.sm]}>
          {Object.values(PREMIUM_FEATURES).map((feat, idx, arr) => (
            <React.Fragment key={feat.id}>
              <PremiumTeaser feature={feat} />
              {idx < arr.length - 1 && <View style={styles.premiumDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    ...Shadow.sm,
  },
  emptyBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  topGreeting: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  topDest: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  resetText: { fontSize: 18 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md + 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  destLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  destName: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroIcon: { fontSize: 36 },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  routeNote: {
    flex: 1,
    backgroundColor: Colors.primaryFaded,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  routeNoteText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  // Widget header
  widgetHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  widgetTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  widgetSub: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Premium
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  premiumBadge: {
    backgroundColor: Colors.accentFaded,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  premiumBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.accentDark,
  },
  premiumCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  premiumDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    gap: 4,
  },
  emoji: { fontSize: 20 },
  value: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
  },
  label: { fontSize: Typography.size.xs, color: Colors.textTertiary },
});

const pStyles = StyleSheet.create({
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  lock: { fontSize: 22 },
  name: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  desc: { fontSize: Typography.size.xs, color: Colors.textTertiary, lineHeight: 16 },
  btn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  btnText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});
