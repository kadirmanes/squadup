import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';

// ─── Mock weather profiles ────────────────────────────────────────────────

const PROFILES = {
  coastal: {
    current: { emoji: '☀️', condition: 'Güneşli', temp: 28, feelsLike: 30, wind: 14, humidity: 55 },
    forecast: [
      { day: 'Yar.', emoji: '🌤️', high: 27, low: 20 },
      { day: '2G',   emoji: '⛅',  high: 25, low: 19 },
      { day: '3G',   emoji: '☀️',  high: 29, low: 21 },
      { day: '4G',   emoji: '🌤️', high: 26, low: 20 },
    ],
  },
  mountain: {
    current: { emoji: '⛅', condition: 'Parçalı Bulutlu', temp: 14, feelsLike: 11, wind: 24, humidity: 70 },
    forecast: [
      { day: 'Yar.', emoji: '🌧️', high: 12, low: 7  },
      { day: '2G',   emoji: '⛅',  high: 15, low: 8  },
      { day: '3G',   emoji: '🌤️', high: 17, low: 9  },
      { day: '4G',   emoji: '☀️',  high: 18, low: 10 },
    ],
  },
  city: {
    current: { emoji: '🌤️', condition: 'Az Bulutlu', temp: 22, feelsLike: 21, wind: 11, humidity: 60 },
    forecast: [
      { day: 'Yar.', emoji: '🌦️', high: 21, low: 15 },
      { day: '2G',   emoji: '☀️',  high: 24, low: 16 },
      { day: '3G',   emoji: '🌤️', high: 23, low: 15 },
      { day: '4G',   emoji: '⛅',  high: 20, low: 14 },
    ],
  },
  default: {
    current: { emoji: '🌤️', condition: 'İyi', temp: 20, feelsLike: 19, wind: 10, humidity: 58 },
    forecast: [
      { day: 'Yar.', emoji: '☀️',  high: 21, low: 13 },
      { day: '2G',   emoji: '🌤️', high: 19, low: 12 },
      { day: '3G',   emoji: '⛅',  high: 18, low: 11 },
      { day: '4G',   emoji: '🌤️', high: 20, low: 13 },
    ],
  },
};

function getProfile(destination = '') {
  const d = destination.toLowerCase();
  const coastal = ['bodrum', 'antalya', 'marmaris', 'fethiye', 'alanya', 'side', 'olimpos'];
  const mountain = ['kapadok', 'erzurum', 'rize', 'trabzon', 'artvin', 'pamukkale', 'dağ'];
  const city = ['istanbul', 'ankara', 'izmir', 'bursa', 'konya', 'gaziantep'];
  if (coastal.some((k) => d.includes(k))) return PROFILES.coastal;
  if (mountain.some((k) => d.includes(k))) return PROFILES.mountain;
  if (city.some((k) => d.includes(k))) return PROFILES.city;
  return PROFILES.default;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function StatPill({ emoji, value }) {
  return (
    <View style={wStyles.statPill}>
      <Text style={wStyles.statEmoji}>{emoji}</Text>
      <Text style={wStyles.statValue}>{value}</Text>
    </View>
  );
}

function ForecastDay({ item }) {
  return (
    <View style={wStyles.forecastDay}>
      <Text style={wStyles.forecastLabel}>{item.day}</Text>
      <Text style={wStyles.forecastEmoji}>{item.emoji}</Text>
      <Text style={wStyles.forecastHigh}>{item.high}°</Text>
      <Text style={wStyles.forecastLow}>{item.low}°</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function WeatherWidget({ destination }) {
  const profile = getProfile(destination);
  const { current, forecast } = profile;

  return (
    <View style={[wStyles.card, Shadow.md]}>
      {/* Header row */}
      <View style={wStyles.header}>
        <View>
          <Text style={wStyles.location}>📍 {destination}</Text>
          <Text style={wStyles.condition}>{current.condition}</Text>
        </View>
        <View style={wStyles.tempRow}>
          <Text style={wStyles.tempEmoji}>{current.emoji}</Text>
          <Text style={wStyles.temp}>{current.temp}°</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={wStyles.statsRow}>
        <StatPill emoji="🌡️" value={`Hissedilen ${current.feelsLike}°`} />
        <StatPill emoji="💨" value={`${current.wind} km/s`} />
        <StatPill emoji="💧" value={`%${current.humidity}`} />
      </View>

      {/* 4-day forecast */}
      <View style={wStyles.divider} />
      <View style={wStyles.forecastRow}>
        {forecast.map((item) => (
          <ForecastDay key={item.day} item={item} />
        ))}
      </View>

      <Text style={wStyles.source}>* Tahmini veriler — seyahat tarihine göre değişebilir</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const wStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md + 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  location: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
    marginBottom: 4,
  },
  condition: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  tempEmoji: { fontSize: 32 },
  temp: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 52,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statEmoji: { fontSize: 12 },
  statValue: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastDay: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  forecastLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  forecastEmoji: { fontSize: 20 },
  forecastHigh: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  forecastLow: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
  },
  source: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
