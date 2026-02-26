import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useTrip } from '../context/TripContext';
import { getDestinationCoords, generateWaypoints } from '../utils/geocoder';

const { height: SCREEN_H } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_H * 0.58;

// Tag → marker color
const TAG_MARKER_COLORS = {
  Yemek: '#E65100',
  Doğa: '#2E7D32',
  Kültür: '#4527A0',
  Aktivite: '#AD1457',
  Premium: '#FF6F00',
  Konaklama: Colors.primary,
  default: Colors.primary,
};

function DayPill({ day, title, isSelected, onPress, color }) {
  return (
    <TouchableOpacity
      style={[
        pillStyles.pill,
        isSelected && { backgroundColor: color, borderColor: color, ...Shadow.sm },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[pillStyles.dayNum, isSelected && { color: '#FFF' }]}>G{day}</Text>
      <Text
        style={[pillStyles.dayTitle, isSelected && { color: '#FFFFFFCC' }]}
        numberOfLines={1}
      >
        {title.split('—')[1]?.trim() || title}
      </Text>
    </TouchableOpacity>
  );
}

function ActivityMarkerCallout({ activity }) {
  const markerColor = TAG_MARKER_COLORS[activity.tag] || TAG_MARKER_COLORS.default;
  return (
    <View style={[calloutStyles.box, Shadow.md]}>
      <View style={[calloutStyles.dot, { backgroundColor: markerColor }]} />
      <View style={calloutStyles.content}>
        <Text style={calloutStyles.time}>{activity.time}</Text>
        <Text style={calloutStyles.title} numberOfLines={2}>{activity.title}</Text>
        {activity.cost && <Text style={calloutStyles.cost}>{activity.cost}</Text>}
      </View>
    </View>
  );
}

export default function MapScreen() {
  const { preferences, tripData } = useTrip();
  const mapRef = useRef(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Fallback if no trip yet
  const destination = preferences?.destination || 'Türkiye';
  const days = tripData?.days || [];
  const centerCoords = useMemo(() => getDestinationCoords(destination), [destination]);
  const waypoints = useMemo(
    () => generateWaypoints(destination, Math.max(days.length, 1)),
    [destination, days.length]
  );

  const currentWaypoint = waypoints.find((w) => w.day === selectedDay) || waypoints[0];
  const currentDayPlan = days.find((d) => d.day === selectedDay);

  // Generate sub-markers for activities of selected day
  const activityMarkers = useMemo(() => {
    if (!currentDayPlan || !currentWaypoint) return [];
    const base = currentWaypoint.coordinate;
    return currentDayPlan.activities.map((act, idx) => ({
      ...act,
      coordinate: {
        latitude: base.latitude + (Math.sin(idx * 1.3 + 0.5) * 0.012),
        longitude: base.longitude + (Math.cos(idx * 1.3 + 0.5) * 0.012),
      },
    }));
  }, [currentDayPlan, currentWaypoint]);

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    setSelectedActivity(null);
    const wp = waypoints.find((w) => w.day === day);
    if (wp && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...wp.coordinate,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        600
      );
    }
  };

  if (!preferences) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>Henüz rota yok</Text>
          <Text style={styles.emptySubtitle}>
            Plan sekmesinden bir seyahat oluştur,{'\n'}harita burada canlanır.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
          initialRegion={{
            latitude: centerCoords.lat,
            longitude: centerCoords.lng,
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          }}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
        >
          {/* Route polyline through all waypoints */}
          <Polyline
            coordinates={waypoints.map((w) => w.coordinate)}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />

          {/* Day markers */}
          {waypoints.map((wp) => (
            <Marker
              key={`day-${wp.day}`}
              coordinate={wp.coordinate}
              onPress={() => handleDaySelect(wp.day)}
            >
              <View
                style={[
                  styles.dayMarker,
                  wp.day === selectedDay && styles.dayMarkerSelected,
                ]}
              >
                <Text style={styles.dayMarkerText}>{wp.day}</Text>
              </View>
            </Marker>
          ))}

          {/* Activity sub-markers for selected day */}
          {activityMarkers.map((act, idx) => {
            const color = TAG_MARKER_COLORS[act.tag] || TAG_MARKER_COLORS.default;
            return (
              <Marker
                key={`act-${selectedDay}-${idx}`}
                coordinate={act.coordinate}
                onPress={() => setSelectedActivity(act)}
              >
                <View style={[styles.actMarker, { backgroundColor: color }]} />
              </Marker>
            );
          })}
        </MapView>

        {/* Overlay — destination chip */}
        <View style={[styles.destChip, Shadow.sm]}>
          <Text style={styles.destChipText}>📍 {destination}</Text>
        </View>

        {/* Selected activity callout */}
        {selectedActivity && (
          <TouchableOpacity
            style={styles.calloutOverlay}
            onPress={() => setSelectedActivity(null)}
            activeOpacity={1}
          >
            <ActivityMarkerCallout activity={selectedActivity} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom panel */}
      <View style={[styles.panel, Shadow.lg]}>
        {/* Day selector pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {days.map((d) => (
            <DayPill
              key={d.day}
              day={d.day}
              title={d.title}
              isSelected={d.day === selectedDay}
              onPress={() => handleDaySelect(d.day)}
              color={Colors.primary}
            />
          ))}
        </ScrollView>

        {/* Selected day summary */}
        {currentDayPlan && (
          <View style={styles.daySummary}>
            <Text style={styles.summaryTitle}>{currentDayPlan.title}</Text>
            <Text style={styles.summarySubtitle}>
              {currentDayPlan.activities.length} aktivite · ₺{currentDayPlan.estimatedCost?.toLocaleString('tr-TR')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activityChipsRow}
            >
              {currentDayPlan.activities.slice(0, 4).map((act, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.activityChip}
                  onPress={() => setSelectedActivity(act)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activityChipTime}>{act.time}</Text>
                  <Text style={styles.activityChipTitle} numberOfLines={1}>{act.title}</Text>
                </TouchableOpacity>
              ))}
              {currentDayPlan.activities.length > 4 && (
                <View style={[styles.activityChip, { justifyContent: 'center' }]}>
                  <Text style={styles.activityChipMore}>
                    +{currentDayPlan.activities.length - 4} daha
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  map: { flex: 1 },

  destChip: {
    position: 'absolute',
    top: Spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  destChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },

  calloutOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },

  dayMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayMarkerSelected: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    ...Shadow.md,
  },
  dayMarkerText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
  },
  actMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  panel: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: Spacing.md,
  },
  pillsRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  daySummary: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  summaryTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  activityChipsRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  activityChip: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    minWidth: 130,
    maxWidth: 170,
  },
  activityChipTime: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginBottom: 2,
  },
  activityChipTitle: {
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
  activityChipMore: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
  },

  emptyState: {
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
});

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    maxWidth: 160,
  },
  dayNum: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textSecondary,
  },
  dayTitle: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    flexShrink: 1,
  },
});

const calloutStyles = StyleSheet.create({
  box: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  content: { flex: 1 },
  time: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  cost: {
    fontSize: Typography.size.xs,
    color: Colors.accent,
    fontWeight: Typography.weight.bold,
    marginTop: 2,
  },
});
