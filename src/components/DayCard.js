import React, { useState } from 'react';
import { getWeatherIcon } from '../services/weatherService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';

// Tag color map
const TAG_COLORS = {
  Mola:       { bg: '#E8F5E9', text: '#4A7C59' },
  Doğa:       { bg: '#E0F2F1', text: '#00695C' },
  Yemek:      { bg: '#FFF8E1', text: '#E65100' },
  Kamping:    { bg: '#E3F2FD', text: '#1565C0' },
  Akşam:      { bg: '#EDE7F6', text: '#4527A0' },
  Aktivite:   { bg: '#FCE4EC', text: '#AD1457' },
  Konaklama:  { bg: '#E8F5E9', text: '#2E7D32' },
  Kültür:     { bg: '#F3E5F5', text: '#6A1B9A' },
  Tur:        { bg: '#E8EAF6', text: '#283593' },
  Premium:    { bg: '#FFF8E1', text: '#FF6F00' },
  Huzur:      { bg: '#E0F2F1', text: '#004D40' },
  Sabah:      { bg: '#FFF9C4', text: '#F57F17' },
  Gastronomi: { bg: '#FBE9E7', text: '#BF360C' },
  Macera:     { bg: '#FCE4EC', text: '#880E4F' },
  Keşif:      { bg: '#E8EAF6', text: '#1A237E' },
  Serbest:    { bg: '#FFF3E0', text: '#E65100' },
  Yolculuk:   { bg: '#E3F2FD', text: '#0D47A1' },
  default:    { bg: '#F5F5F5', text: '#616161' },
};

function ActivityRow({ activity, isLast, onPress }) {
  const tagStyle = TAG_COLORS[activity.tag] || TAG_COLORS.default;

  return (
    <TouchableOpacity
      style={styles.activityRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Timeline line */}
      <View style={styles.timelineCol}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Content */}
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTime}>{activity.time}</Text>
          <View style={[styles.tag, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.tagText, { color: tagStyle.text }]}>
              {activity.tag}
            </Text>
          </View>
          {activity.cost && (
            <View style={styles.costBadge}>
              <Text style={styles.costText}>{activity.cost}</Text>
            </View>
          )}
        </View>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        {onPress && (
          <Text style={styles.tapHint}>Detay için dokun →</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const ACCOM_ICONS = { kamp: '⛺', otel: '🏨', kiralık: '🏠', caravan: '🚐', camping: '⛺', hotel: '🏨', default: '🌙' };
const ACCOM_LABELS = { kamp: 'Kamp', otel: 'Otel', kiralık: 'Kiralık', default: 'Konaklama' };

function AccommodationOptions({ options }) {
  const [selected, setSelected] = useState(0);
  if (!options || !options.length) return null;

  const opt = options[Math.min(selected, options.length - 1)];
  const icon = ACCOM_ICONS[opt?.type] || ACCOM_ICONS.default;

  return (
    <View style={accomStyles.card}>
      <View style={accomStyles.header}>
        <Text style={accomStyles.moonIcon}>🌙</Text>
        <Text style={accomStyles.headerText}>Bu Gece Konaklama Seçenekleri</Text>
      </View>

      {/* Type tabs */}
      <View style={accomStyles.tabs}>
        {options.map((o, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelected(i)}
            style={[accomStyles.tab, selected === i && accomStyles.tabActive]}
            activeOpacity={0.75}
          >
            <Text style={accomStyles.tabText}>
              {ACCOM_ICONS[o.type] || '🌙'} {ACCOM_LABELS[o.type] || o.type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected option details */}
      <View style={accomStyles.body}>
        <View style={accomStyles.nameRow}>
          <Text style={accomStyles.icon}>{icon}</Text>
          <Text style={accomStyles.name}>{opt.name}</Text>
        </View>
        {opt.address ? (
          <Text style={accomStyles.address}>📍 {opt.address}</Text>
        ) : null}
        <View style={accomStyles.pillRow}>
          {opt.cost ? (
            <View style={accomStyles.pill}>
              <Text style={accomStyles.pillText}>💰 {opt.cost}</Text>
            </View>
          ) : null}
          {opt.facilities ? (
            <View style={accomStyles.pill}>
              <Text style={accomStyles.pillText} numberOfLines={1}>⚙️ {opt.facilities}</Text>
            </View>
          ) : null}
        </View>
        {opt.note ? (
          <Text style={accomStyles.note}>ℹ️ {opt.note}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Fallback for single accommodation (offline/template routes)
function AccommodationCard({ accommodation }) {
  if (!accommodation) return null;
  const icon = ACCOM_ICONS[accommodation.type] || ACCOM_ICONS.default;
  return (
    <View style={accomStyles.card}>
      <View style={accomStyles.header}>
        <Text style={accomStyles.moonIcon}>🌙</Text>
        <Text style={accomStyles.headerText}>Bu Gece Konaklama</Text>
      </View>
      <View style={accomStyles.body}>
        <View style={accomStyles.nameRow}>
          <Text style={accomStyles.icon}>{icon}</Text>
          <Text style={accomStyles.name}>{accommodation.name}</Text>
        </View>
        {accommodation.address ? (
          <Text style={accomStyles.address}>📍 {accommodation.address}</Text>
        ) : null}
        <View style={accomStyles.pillRow}>
          {accommodation.cost ? (
            <View style={accomStyles.pill}>
              <Text style={accomStyles.pillText}>💰 {accommodation.cost}</Text>
            </View>
          ) : null}
          {accommodation.facilities ? (
            <View style={accomStyles.pill}>
              <Text style={accomStyles.pillText} numberOfLines={1}>⚙️ {accommodation.facilities}</Text>
            </View>
          ) : null}
        </View>
        {accommodation.note ? (
          <Text style={accomStyles.note}>ℹ️ {accommodation.note}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function DayCard({ dayPlan, isExpanded: initialExpanded = false, onActivityPress }) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const { day, title, subtitle, activities = [], estimatedCost, accommodation, accommodationOptions, weather } = dayPlan;

  const weatherIcon = weather?.icon ? getWeatherIcon(weather.icon) : null;
  const weatherDesc = weather ? `${weatherIcon} ${weather.temp}°C` : null;

  return (
    <View style={[styles.card, Shadow.sm]}>
      {/* Day header — tap to expand */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.75}
      >
        <View style={styles.dayBadge}>
          <Text style={styles.dayNumber}>{day}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.dayTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.daySubtitle}>
            {weatherDesc ? `${weatherDesc}  ` : ''}{subtitle}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.costEstimate}>
            ₺{estimatedCost?.toLocaleString('tr-TR')}
          </Text>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Activities — collapsible */}
      {expanded && (
        <View style={styles.activitiesContainer}>
          <View style={styles.divider} />
          {activities.map((activity, idx) => (
            <ActivityRow
              key={`${day}-${idx}`}
              activity={activity}
              isLast={idx === activities.length - 1}
              onPress={onActivityPress ? () => onActivityPress(activity, idx) : undefined}
            />
          ))}
          {accommodationOptions?.length > 0
            ? <AccommodationOptions options={accommodationOptions} />
            : <AccommodationCard accommodation={accommodation} />
          }
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dayBadge: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dayNumber: { fontSize: Typography.size.lg, fontWeight: Typography.weight.extrabold, color: Colors.primary },
  headerText: { flex: 1, gap: 2 },
  dayTitle:   { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  daySubtitle: { fontSize: Typography.size.xs, color: Colors.textTertiary },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  costEstimate: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.primary },
  expandIcon:   { fontSize: 10, color: Colors.textTertiary },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  activitiesContainer: { paddingBottom: Spacing.sm },
  activityRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, minHeight: 60 },
  timelineCol: { width: 20, alignItems: 'center', paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.primaryFaded },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.borderLight, marginTop: 4 },
  activityContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.sm },
  activityHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: 4 },
  activityTime: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.textSecondary, minWidth: 42 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  tagText: { fontSize: 10, fontWeight: Typography.weight.semibold },
  costBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: Colors.accentFaded },
  costText: { fontSize: 10, fontWeight: Typography.weight.bold, color: Colors.accentDark },
  activityTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textPrimary, lineHeight: 20 },
  tapHint: { fontSize: 10, color: Colors.primary, marginTop: 3, fontWeight: Typography.weight.medium },
});

const accomStyles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.md,
    borderRadius: Radius.xl, backgroundColor: Colors.primaryDark, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm + 2, paddingBottom: Spacing.xs,
  },
  moonIcon: { fontSize: 16 },
  headerText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.primaryLight, letterSpacing: 0.5, textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  tab: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { fontSize: 11, color: '#FFFFFF', fontWeight: Typography.weight.semibold },
  body: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.xs + 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  icon:    { fontSize: 20 },
  name:    { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF', flex: 1 },
  address: { fontSize: Typography.size.xs, color: Colors.primaryLight, opacity: 0.85 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, maxWidth: '100%' },
  pillText: { fontSize: 10, color: Colors.primaryLight, fontWeight: Typography.weight.medium },
  note: { fontSize: Typography.size.xs, color: Colors.primaryLight, opacity: 0.75, fontStyle: 'italic' },
});
